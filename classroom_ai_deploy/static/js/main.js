document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const confSlider = document.getElementById('confSlider');
    const confVal = document.getElementById('confVal');
    
    const countTotal = document.getElementById('countTotal');
    const countPose = document.getElementById('countPose');
    const countFar = document.getElementById('countFar');
    
    const tabResult = document.getElementById('tabResult');
    const tabOriginal = document.getElementById('tabOriginal');
    const mainImage = document.getElementById('mainImage');
    const emptyState = document.getElementById('emptyState');
    const downloadBtn = document.getElementById('downloadBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    const sampleCards = document.querySelectorAll('.sample-card');

    let currentResultUrl = null;
    let currentOriginalUrl = null;

    // 1. Slider change
    confSlider.addEventListener('input', (e) => {
        confVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    // 2. Drag and Drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUploadFile(files[0]);
        }
    });

    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleUploadFile(fileInput.files[0]);
        }
    });

    // 3. Sample Cards click
    sampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const sampleFile = card.getAttribute('data-sample');
            handleSamplePredict(sampleFile);
        });
    });

    // 4. API Call for uploaded file
    function handleUploadFile(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('conf_thresh', confSlider.value);
        executeInference(formData);
    }

    // 5. API Call for sample file
    function handleSamplePredict(sampleName) {
        const formData = new FormData();
        formData.append('sample_name', sampleName);
        formData.append('conf_thresh', confSlider.value);
        executeInference(formData);
    }

    // 6. Execute inference and handle response
    async function executeInference(formData) {
        showLoading(true);
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                alert('Lỗi: ' + (data.error || 'Xảy ra lỗi trong quá trình xử lý ảnh'));
                showLoading(false);
                return;
            }

            // Update URLs
            currentResultUrl = data.result_url;
            currentOriginalUrl = data.original_url;

            // Animate counters
            animateCounter(countTotal, data.total_students);
            animateCounter(countPose, data.pose_students);
            animateCounter(countFar, data.far_head_students);

            // Show result image
            emptyState.style.display = 'none';
            mainImage.style.display = 'block';
            mainImage.src = currentResultUrl;
            
            // Set active tab to result
            tabResult.classList.add('active');
            tabOriginal.classList.remove('active');

            // Enable download
            downloadBtn.style.display = 'inline-flex';

        } catch (error) {
            console.error('Error:', error);
            alert('Lỗi kết nối tới máy chủ AI!');
        } finally {
            showLoading(false);
        }
    }

    // 7. Tabs switching
    tabResult.addEventListener('click', () => {
        if (!currentResultUrl) return;
        tabResult.classList.add('active');
        tabOriginal.classList.remove('active');
        mainImage.src = currentResultUrl;
    });

    tabOriginal.addEventListener('click', () => {
        if (!currentOriginalUrl) return;
        tabOriginal.classList.add('active');
        tabResult.classList.remove('active');
        mainImage.src = currentOriginalUrl;
    });

    // 8. Download Result
    downloadBtn.addEventListener('click', () => {
        if (!currentResultUrl) return;
        const a = document.createElement('a');
        a.href = currentResultUrl;
        a.download = 'classroom_detection_result.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // 9. Fullscreen Viewer
    fullscreenBtn.addEventListener('click', () => {
        const viewerContainer = document.querySelector('.image-canvas-container');
        if (!document.fullscreenElement) {
            viewerContainer.requestFullscreen().catch(err => {
                alert(`Lỗi chế độ toàn màn hình: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Helper: Show/Hide Loading
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }

    // Helper: Counter Animation
    function animateCounter(elem, target) {
        let current = 0;
        const duration = 600;
        const step = Math.max(1, Math.floor(target / (duration / 25)));
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                elem.textContent = target;
                clearInterval(timer);
            } else {
                elem.textContent = current;
            }
        }, 25);
    }
});
