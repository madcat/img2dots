
import Alpine from 'alpinejs'
window.Alpine = Alpine
import { resetCanvas, loadSVG, initGUI } from './draw.js'


document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        uploaded: false,
        size: { width: 0, height: 0 },
        pixelRatio: 2.0,

        loadBorders() {
            loadSVG()
        },

        selectImage(e) {
            this.uploaded = false
            let files = e.target.files
            if (files.length === 0) return

            this.getImageData(files[0])
        },

        uploadImage(e) {
            this.uploaded = false
            let files = e.target.files
            if (files.length === 0) return

            this.getImageData(files[0])
        },

        // draw uploaded image file on temporary canvas then get image data
        async getImageData(file) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            // const reader = new FileReader()
            this.uploaded = true

            var that = this

            // reader.onload = (e) => {
            // img.src = e.target.result
            img.onload = () => {
                this.size.width = img.width
                this.size.height = img.height
                resetCanvas(this.$refs.canvas, img, this.pixelRatio)

                initGUI()
                // canvas.width = img.width;
                // canvas.height = img.height;
                // ctx.drawImage(img, 0, 0);
                // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // console.log(imageData);
            };
            // }
            // reader.readAsDataURL(file)
            img.src = URL.createObjectURL(file);
        },

    }))
})
Alpine.start()

// console.log(THREE)

