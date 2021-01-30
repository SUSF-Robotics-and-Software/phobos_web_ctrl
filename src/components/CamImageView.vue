<template>
    <div>
        <canvas id="cam_img_canvas" width="640" height="480"></canvas>
        <v-btn-toggle
            id="cam_img_btns"
            v-model="image_selection"
            dense
            mandatory
        >
            <v-btn text>L</v-btn>
            <v-btn text>M</v-btn>
            <v-btn text>R</v-btn>
        </v-btn-toggle>
    </div>
</template>

<script>
export default {
    data: () => {
        return {
            view_context: null,
            image_selection: 0,
        };
    },
    methods: {
        draw() {
            const img = new Image();
            img.src = `data:image/jpg;base64,${this.get_img_data()}`;
            var ctx = this.view_context;
            img.onload = function() {
                ctx.drawImage(this, 0, 0, ctx.canvas.width, ctx.canvas.height);
            };
        },
        get_img_data() {
            switch (this.image) {
                case 'right':
                    if (this.$store.state.tm.right_cam_frame !== null) {
                        return this.$store.state.tm.right_cam_frame.b64_data;
                    } else {
                        return null;
                    }
                case 'middle':
                    if (this.$store.state.tm.middle_cam_frame !== null) {
                        return this.$store.state.tm.middle_cam_frame.b64_data;
                    } else {
                        return null;
                    }
                case 'left':
                default:
                    if (this.$store.state.tm.left_cam_frame !== null) {
                        return this.$store.state.tm.left_cam_frame.b64_data;
                    } else {
                        return null;
                    }
            }
        },
    },
    computed: {
        image() {
            switch (this.image_selection) {
                case 1:
                    return 'middle';
                case 2:
                    return 'right';
                case 0:
                default:
                    return 'left';
            }
        },
    },
    mounted() {
        // Get the canvas item
        var c = document.getElementById('cam_img_canvas');
        var ctx = c.getContext('2d');
        this.view_context = ctx;

        // Bind tm event to draw
        this.$store.watch(this.get_img_data, () => {
            this.draw();
        });
    },
};
</script>

<style>
#cam_img_btns {
    position: relative;
    right: 200px;
    bottom: 26px;
}
</style>
