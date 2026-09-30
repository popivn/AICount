import torch
import torch.nn as nn
import numpy as np

def make_vgg16_bn_features():
    cfg = [64, 64, 'M', 128, 128, 'M', 256, 256, 256, 'M', 512, 512, 512, 'M', 512, 512, 512, 'M']
    layers = []
    in_channels = 3
    for v in cfg:
        if v == 'M':
            layers += [nn.MaxPool2d(kernel_size=2, stride=2)]
        else:
            conv2d = nn.Conv2d(in_channels, v, kernel_size=3, padding=1)
            layers += [conv2d, nn.BatchNorm2d(v), nn.ReLU(inplace=True)]
            in_channels = v
    return nn.Sequential(*layers)

class BackboneBase_VGG(nn.Module):
    def __init__(self):
        super().__init__()
        features = list(make_vgg16_bn_features().children())
        self.body1 = nn.Sequential(*features[:13])
        self.body2 = nn.Sequential(*features[13:23])
        self.body3 = nn.Sequential(*features[23:33])
        self.body4 = nn.Sequential(*features[33:43])

    def forward(self, x):
        out = []
        xs = x
        for layer in [self.body1, self.body2, self.body3, self.body4]:
            xs = layer(xs)
            out.append(xs)
        return out

class RegressionModel(nn.Module):
    def __init__(self, num_features_in=256, num_anchor_points=4, feature_size=256):
        super().__init__()
        self.conv1 = nn.Conv2d(num_features_in, feature_size, kernel_size=3, padding=1)
        self.act1 = nn.ReLU()
        self.conv2 = nn.Conv2d(feature_size, feature_size, kernel_size=3, padding=1)
        self.act2 = nn.ReLU()
        self.output = nn.Conv2d(feature_size, num_anchor_points * 2, kernel_size=3, padding=1)

    def forward(self, x):
        out = self.act1(self.conv1(x))
        out = self.act2(self.conv2(out))
        out = self.output(out)
        out = out.permute(0, 2, 3, 1)
        return out.contiguous().view(out.shape[0], -1, 2)

class ClassificationModel(nn.Module):
    def __init__(self, num_features_in=256, num_anchor_points=4, num_classes=2, feature_size=256):
        super().__init__()
        self.num_classes = num_classes
        self.num_anchor_points = num_anchor_points
        self.conv1 = nn.Conv2d(num_features_in, feature_size, kernel_size=3, padding=1)
        self.act1 = nn.ReLU()
        self.conv2 = nn.Conv2d(feature_size, feature_size, kernel_size=3, padding=1)
        self.act2 = nn.ReLU()
        self.output = nn.Conv2d(feature_size, num_anchor_points * num_classes, kernel_size=3, padding=1)

    def forward(self, x):
        out = self.act1(self.conv1(x))
        out = self.act2(self.conv2(out))
        out = self.output(out)
        out1 = out.permute(0, 2, 3, 1)
        b, w, h, _ = out1.shape
        out2 = out1.view(b, w, h, self.num_anchor_points, self.num_classes)
        return out2.contiguous().view(x.shape[0], -1, self.num_classes)

def generate_anchor_points(stride=16, row=2, line=2):
    row_step = stride / row
    line_step = stride / line
    shift_x = (np.arange(1, line + 1) - 0.5) * line_step - stride / 2
    shift_y = (np.arange(1, row + 1) - 0.5) * row_step - stride / 2
    shift_x, shift_y = np.meshgrid(shift_x, shift_y)
    return np.vstack((shift_x.ravel(), shift_y.ravel())).transpose()

def shift_anchors(shape, stride, anchor_points):
    shift_x = (np.arange(0, shape[1]) + 0.5) * stride
    shift_y = (np.arange(0, shape[0]) + 0.5) * stride
    shift_x, shift_y = np.meshgrid(shift_x, shift_y)
    shifts = np.vstack((shift_x.ravel(), shift_y.ravel())).transpose()
    A = anchor_points.shape[0]
    K = shifts.shape[0]
    all_anchors = (anchor_points.reshape((1, A, 2)) + shifts.reshape((1, K, 2)).transpose((1, 0, 2)))
    return all_anchors.reshape((K * A, 2))

class AnchorPoints(nn.Module):
    def __init__(self, pyramid_levels=None, strides=None, row=2, line=2):
        super().__init__()
        self.pyramid_levels = [3] if pyramid_levels is None else pyramid_levels
        self.strides = [2 ** x for x in self.pyramid_levels] if strides is None else strides
        self.row = row
        self.line = line

    def forward(self, image):
        image_shape = np.array(image.shape[2:])
        image_shapes = [(image_shape + 2 ** x - 1) // (2 ** x) for x in self.pyramid_levels]
        all_anchors = np.zeros((0, 2), dtype=np.float32)
        for idx, p in enumerate(self.pyramid_levels):
            anchors = generate_anchor_points(2**p, row=self.row, line=self.line)
            shifted = shift_anchors(image_shapes[idx], self.strides[idx], anchors)
            all_anchors = np.append(all_anchors, shifted, axis=0)
        all_anchors = np.expand_dims(all_anchors, axis=0)
        return torch.from_numpy(all_anchors.astype(np.float32)).to(image.device)

class Decoder(nn.Module):
    def __init__(self, C3_size=256, C4_size=512, C5_size=512, feature_size=256):
        super().__init__()
        self.P5_1 = nn.Conv2d(C5_size, feature_size, kernel_size=1, stride=1, padding=0)
        self.P5_upsampled = nn.Upsample(scale_factor=2, mode='nearest')
        self.P5_2 = nn.Conv2d(feature_size, feature_size, kernel_size=3, stride=1, padding=1)
        self.P4_1 = nn.Conv2d(C4_size, feature_size, kernel_size=1, stride=1, padding=0)
        self.P4_upsampled = nn.Upsample(scale_factor=2, mode='nearest')
        self.P4_2 = nn.Conv2d(feature_size, feature_size, kernel_size=3, stride=1, padding=1)
        self.P3_1 = nn.Conv2d(C3_size, feature_size, kernel_size=1, stride=1, padding=0)
        self.P3_upsampled = nn.Upsample(scale_factor=2, mode='nearest')
        self.P3_2 = nn.Conv2d(feature_size, feature_size, kernel_size=3, stride=1, padding=1)

    def forward(self, inputs):
        C3, C4, C5 = inputs
        P5_x = self.P5_2(self.P5_upsampled(self.P5_1(C5)))
        P4_x = self.P4_2(self.P4_upsampled(self.P4_1(C4) + P5_x))
        P3_x = self.P3_2(self.P3_upsampled(self.P3_1(C3) + P4_x))
        return [P3_x, P4_x, P5_x]

class StandaloneP2PNet(nn.Module):
    def __init__(self, row=2, line=2):
        super().__init__()
        self.backbone = BackboneBase_VGG()
        num_anchors = row * line
        self.regression = RegressionModel(num_features_in=256, num_anchor_points=num_anchors)
        self.classification = ClassificationModel(num_features_in=256, num_classes=2, num_anchor_points=num_anchors)
        self.anchor_points = AnchorPoints(pyramid_levels=[3], row=row, line=line)
        self.fpn = Decoder(256, 512, 512)

    def forward(self, samples):
        features = self.backbone(samples)
        features_fpn = self.fpn([features[1], features[2], features[3]])
        batch_size = features[0].shape[0]
        regression = self.regression(features_fpn[1]) * 100
        classification = self.classification(features_fpn[1])
        anchors = self.anchor_points(samples).repeat(batch_size, 1, 1)
        output_coord = regression + anchors
        return {'pred_logits': classification, 'pred_points': output_coord}

if __name__ == '__main__':
    model = StandaloneP2PNet()
    ckpt = torch.load('weights/SHTechA.pth', map_location='cpu')
    state_dict = ckpt['model']
    # Check key compatibility
    res = model.load_state_dict(state_dict, strict=False)
    print("Missing keys:", len(res.missing_keys), res.missing_keys[:5])
    print("Unexpected keys:", len(res.unexpected_keys), res.unexpected_keys[:5])
    
    # Test dummy inference
    dummy = torch.randn(1, 3, 256, 256)
    out = model(dummy)
    print("Output shapes:", out['pred_logits'].shape, out['pred_points'].shape)
    print("[+] TEST LOAD SUCCESSFUL!")
