
import Alpine from 'alpinejs'
window.Alpine = Alpine
import { resetCanvas, sampleTexture, togglePlaneMesh, loadSVG, initGUI } from './draw.js'


document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        uploaded: false,

        imageVisible: true,

        toggleImage() {
            this.imageVisible = !this.imageVisible
            togglePlaneMesh(this.imageVisible)
        },

        loadBorders() {
            loadSVG()
        },

        selectImage(e) {

        },

        uploadImage(e) {
            this.uploaded = false
            let files = e.target.files
            if (files.length === 0) return

            this.getImageData(files[0])
        },

        sampleImage() {
            sampleTexture()
        },

        // draw uploaded image file on temporary canvas then get image data
        async getImageData(file) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            // const reader = new FileReader()




            // reader.onload = (e) => {
            // img.src = e.target.result
            img.onload = () => {
                resetCanvas(this.$refs.canvas, img)

                initGUI()

                this.uploaded = true

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

