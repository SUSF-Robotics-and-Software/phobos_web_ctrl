<template>
    <div></div>
</template>

<script>
export default {
    data: () => ({
        gamepads: [],
        active_gamepad: -1,
        button_interval: null,
        mnvr_type: 'ack',
        dead_zone: 0.05,
        raw_tc: '',
        max_rover_velocity: 0.2, //TEMP, requires rover params
        max_crab: Math.PI / 2, //TEMP
        max_curvature: 5, //TEMP
        max_angular_velocity: 0.85 //TEMP
    }),

    props: ['safe'],

    created: function() {
        window.addEventListener(
            'gamepadconnected',
            e => this.gamepadHandler(e, true),
            false
        );
        window.addEventListener(
            'gamepaddisconnected',
            e => this.gamepadHandler(e, false),
            false
        );
    },
    beforeDestroy: function() {
        clearInterval(this.button_interval);
    },
    methods: {
        gamepadHandler(event, connecting) {
            var gamepad = event.gamepad;

            if (connecting && gamepad.id.includes('Xbox')) {
                if (Object.keys(this.gamepads).length == 0) {
                    this.active_gamepad = gamepad.index;
                    this.button_interval = setInterval(() => {
                        this.buttons(
                            navigator.getGamepads()[this.active_gamepad].buttons
                        );
                        this.joystics_mnvr(
                            navigator.getGamepads()[this.active_gamepad].axes
                        );
                    }, 100);
                }

                console.log(gamepad.id, ' connected');
                this.gamepads[gamepad.index] = gamepad;

            } else {
                console.log(gamepad.id, ' disconnected');
                delete this.gamepads[gamepad.index];

                if (this.active_gamepad == gamepad.index) {
                    this.active_gamepad = -1;
                    clearInterval(this.button_interval);
                }
            }

            console.log('Active gamepad index:', this.active_gamepad );
            console.log('Gamepads:', this.gamepads);
        },
        buttons(gp_buttons) {
            var held_button = null;
            this.button_mnvr(gp_buttons, held_button);
            this.button_mnvr_type(gp_buttons, held_button);
        },
        button_mnvr(gp_buttons, held_button) {
            if (
                gp_buttons[12].pressed == true &&
                held_button == null &&
                !this.safe
            ) {
                this.safe_command();
                held_button = -1;
            }

            if (
                gp_buttons[12].pressed == true &&
                held_button == null &&
                this.safe
            ) {
                held_button = setTimeout(() => {
                    clearTimeout(held_button);
                    this.safe_command();
                }, 300);
            } else if (gp_buttons[12].pressed == false) {
                clearTimeout(held_button);
                held_button = null;
            }
        },
        button_mnvr_type(gp_buttons, held_button) {
            if (gp_buttons[2].pressed == true && held_button == null) {
                this.mnvr_type = this.mnvr_type == 'ack' ? 'pt' : 'ack';
                held_button = -1;
            } else if (gp_buttons[2].pressed == false && held_button != null) {
                held_button = null;
            }
            //DP down (15) Toggle camera
            //Y (3) Switch to arm control
        },
        joystics_mnvr(gp_axes) {
            if (this.mnvr_type == 'ack') {
                this.joystics_mnvr_ack(gp_axes);
            } else {
                this.joystics_mnvr_pt(gp_axes);
            }
        },
        joystics_mnvr_ack(gp_axes) {
            var movement_magnitude =
                ((Math.sqrt(gp_axes[0] ** 2 + gp_axes[1] ** 2) * gp_axes[1]) /
                    Math.abs(gp_axes[1])) *
                this.max_rover_velocity;
            var rover_velocity =
                Math.abs(movement_magnitude) > this.dead_zone
                    ? -movement_magnitude
                    : 0;

            var carb_angle =
                Math.abs(gp_axes[0]) > 2 * this.dead_zone
                    ? -gp_axes[0] * this.max_crab
                    : 0;

            var curvature =
                Math.abs(gp_axes[2]) > this.dead_zone
                    ? -gp_axes[2] * this.max_curvature
                    : 0;

            if (
                this.raw_tc !=
                'mnvr ack ' +
                    rover_velocity +
                    ' ' +
                    curvature +
                    ' ' +
                    carb_angle
            ) {
                this.raw_tc =
                    'mnvr ack ' +
                    rover_velocity +
                    ' ' +
                    curvature +
                    ' ' +
                    carb_angle;
                this.send_command();
            }
        },
        joystics_mnvr_pt(gp_axes) {
            var angular_velocity =
                Math.abs(gp_axes[1]) > this.dead_zone
                    ? -gp_axes[1] * this.max_angular_velocity
                    : 0;

            if (this.raw_tc != 'mnvr pt ' + angular_velocity) {
                this.raw_tc = 'mnvr pt ' + angular_velocity;
                this.send_command();
            }
        },
        safe_command() {
            this.raw_tc = this.safe ? 'unsafe' : 'safe';
            this.send_command();
        },
        send_command() {
            this.$emit('controller_command', this.raw_tc);
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
    },
};
</script>
