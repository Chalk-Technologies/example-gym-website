document.addEventListener('DOMContentLoaded', () => {
    // Create modal overlay container
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';
    modalOverlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        z-index: 1000;
        justify-content: center;
        align-items: center;
    `;

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'iframe-container';
    iframeContainer.style.cssText = `
        position: relative;
        width: 90%;
        max-width: 1200px;
        height: 80vh;
        background-color: white;
        border-radius: 10px;
        overflow: hidden;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: #ff4136;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        z-index: 10;
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;

    // Assemble the modal
    iframeContainer.appendChild(closeButton);
    iframeContainer.appendChild(iframe);
    modalOverlay.appendChild(iframeContainer);
    document.body.appendChild(modalOverlay);

    // Close modal function
    function closeModal() {
        modalOverlay.style.display = 'none';
        iframe.src = '';
    }

    // Close button event
    closeButton.addEventListener('click', closeModal);

    // Close modal when clicking outside the iframe
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Add click event to all CTA buttons with widget info
    const ctaButtons = document.querySelectorAll('.cta-button[data-widget-info]');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get widget info from data attribute
            const widgetInfo = button.getAttribute('data-widget-info');
            
            // Construct full URL
            const iframeUrl = `https://widgets-dev-kpe3ohblca-ew.a.run.app/${widgetInfo}`;
            
            // Set iframe source and display modal
            iframe.src = iframeUrl;
            modalOverlay.style.display = 'flex';
        });
    });
});
