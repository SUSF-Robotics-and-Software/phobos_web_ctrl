<template>
    <div></div>
</template>

<script>
export default {
    data: () => ({
        gamepads: [],
        held_button: [],
        gamepad: null,
        gamepad_polling: null,
        mnvr_type: 'ack',
        raw_tc: '',
        axes_values: {
            0: 0, // LS L-R [-1, 1]
            1: 0, // LS U-D [-1, 1]
            2: 0, // RS L-R [-1, 1]
            3: 0, // RS U-D [-1, 1]
        },
        axes_mapping: {
            velocity: {
                index: 1, //LS U-D
                value: 0,
                dead_zone: 0.05,
            },
            crab: {
                index: 0, //LS L-R
                value: 0,
                dead_zone: 0.1,
            },
            curvature: {
                index: 2, //RS L-R
                value: 0,
                dead_zone: 0.05,
            },
            angular_velocity: {
                index: 1, //LS U-D
                value: 0,
                dead_zone: 0.05,
            },
        },
        max_rover_velocity: 0.175, //TEMP, requires rover params
        max_crab: Math.PI / 2, //TEMP
        max_curvature: 5, //TEMP
        max_angular_velocity: 1.2, //TEMP
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
        document.addEventListener('gamepadButtonDown', e => {
            this.button_handler(e.detail.buttonIndex, true);
        });
        document.addEventListener('gamepadButtonUp', e => {
            this.button_handler(e.detail.buttonIndex, false);
        });
        document.addEventListener('gamepadAxes', e => {
            this.axes_values[e.detail.axesIndex] = e.detail.axesValue;
            this.axes_handler();
        });
    },
    computed: {
        button_map() {
            return {
                0: null, //A
                1: null, //B
                2: this.button_mnvr_type, //X Change Drive Mode
                3: null, //Y Switch Arm Control
                4: null, //LB
                5: null, //RB
                6: null, //LT
                7: null, //RT
                8: null, //View
                9: null, //Menu
                10: null, //LS
                11: null, //RS
                12: this.toggle_safe, //DP U Toggle Safe
                13: null, //DP L
                14: null, //DP R
                15: null, //DP D Toggle Camera
            };
        },
    },
    methods: {
        updateGamepad() {
            this.gamepad_polling = requestAnimationFrame(this.updateGamepad);
            let new_gamepad_state = navigator.getGamepads()[this.gamepad.index];

            if (this.gamepad_polling % 5 == 0) {
                new_gamepad_state.buttons.forEach((button, index) => {
                    const old_button_value = this.gamepad?.buttons[index].value;
                    if (button.value !== old_button_value) {
                        if (button.pressed) {
                            document.dispatchEvent(
                                new CustomEvent('gamepadButtonDown', {
                                    detail: {
                                        buttonIndex: index,
                                        buttonValue: button.value,
                                    },
                                })
                            );
                        }
                        if (
                            !button.pressed &&
                            this.gamepad?.buttons[index].pressed
                        ) {
                            document.dispatchEvent(
                                new CustomEvent('gamepadButtonUp', {
                                    detail: { buttonIndex: index },
                                })
                            );
                        }
                    }
                });

                let new_axes_mapping = {
                    velocity: this.axes_mapping.velocity.value,
                    crab: this.axes_mapping.crab.value,
                    curvature: this.axes_mapping.curvature.value,
                    angular_velocity: this.axes_mapping.angular_velocity.value,
                };

                new_axes_mapping.velocity =
                    Math.abs(
                        new_gamepad_state.axes[this.axes_mapping.velocity.index]
                    ) > this.axes_mapping.velocity.dead_zone
                        ? new_gamepad_state.axes[
                              this.axes_mapping.velocity.index
                          ]
                        : 0;

                new_axes_mapping.crab =
                    Math.abs(
                        new_gamepad_state.axes[this.axes_mapping.crab.index]
                    ) > this.axes_mapping.crab.dead_zone
                        ? new_gamepad_state.axes[this.axes_mapping.crab.index]
                        : 0;

                new_axes_mapping.curvature =
                    Math.abs(
                        new_gamepad_state.axes[
                            this.axes_mapping.curvature.index
                        ]
                    ) > this.axes_mapping.curvature.dead_zone
                        ? new_gamepad_state.axes[
                              this.axes_mapping.curvature.index
                          ]
                        : 0;

                new_axes_mapping.angular_velocity =
                    Math.abs(
                        new_gamepad_state.axes[
                            this.axes_mapping.angular_velocity.index
                        ]
                    ) > this.axes_mapping.angular_velocity.dead_zone
                        ? new_gamepad_state.axes[
                              this.axes_mapping.angular_velocity.index
                          ]
                        : 0;

                for (var parameter in this.axes_mapping) {
                    if (
                        this.axes_mapping[parameter].value !=
                        new_axes_mapping[parameter]
                    ) {
                        this.axes_mapping[parameter].value =
                            new_axes_mapping[parameter];
                        this.axes_handler();
                    }
                }
                this.gamepad = new_gamepad_state;
            }
        },
        gamepadHandler(event, connecting) {
            let gamepad_event = event.gamepad;

            if (connecting && gamepad_event.id.includes('Xbox')) {
                if (Object.keys(this.gamepads).length == 0) {
                    this.gamepad = gamepad_event;
                    this.updateGamepad();
                }

                console.log(gamepad_event.id, ' connected');
                this.gamepads[gamepad_event.index] = gamepad_event;
            } else if (gamepad_event.id.includes('Xbox')) {
                console.log(gamepad_event.id, ' disconnected');
                delete this.gamepads[gamepad_event.index];

                if (this.gamepad.index == gamepad_event.index) {
                    this.gamepad = {};
                    cancelAnimationFrame(this.gamepad_polling);
                }
            }

            console.log('Active gamepad index:', this.gamepad.index);
            console.log('Gamepads:', this.gamepads);
        },
        button_handler(button, pressed) {
            if (typeof this.button_map[button] == 'function') {
                this.button_map[button](pressed);
            }
        },
        toggle_safe(pressed) {
            if (this.safe && pressed) {
                this.held_button[0] = setTimeout(() => {
                    this.raw_tc = 'unsafe';
                    this.send_command();
                }, 300);
            } else if (pressed) {
                this.raw_tc = 'safe';
                this.send_command();
            } else {
                clearTimeout(this.held_button[0]);
            }
        },
        button_mnvr_type(pressed) {
            if (pressed) {
                this.mnvr_type = this.mnvr_type == 'ack' ? 'pt' : 'ack';
                this.raw_tc = 'mnvr stop';
                this.send_command();
            }
        },
        axes_handler() {
            if (this.mnvr_type == 'ack') {
                this.joystics_mnvr_ack();
            } else {
                this.joystics_mnvr_pt();
            }
        },
        joystics_mnvr_ack() {
            var rover_velocity = 0;
            var carb_angle = 0;
            var curvature = 0;

            if (this.axes_mapping.velocity.value != 0) {
                rover_velocity = (
                    (Math.max(
                        Math.abs(this.axes_mapping.velocity.value) -
                            this.axes_mapping.velocity.dead_zone,
                        Math.abs(this.axes_mapping.crab.value) -
                            this.axes_mapping.crab.dead_zone
                    ) *
                        -this.axes_mapping.velocity.value *
                        this.max_rover_velocity) /
                    (Math.abs(this.axes_mapping.velocity.value) *
                        (1 - this.axes_mapping.velocity.dead_zone))
                ).toFixed(3);
            }

            if (this.axes_mapping.crab.value != 0) {
                carb_angle = (
                    ((Math.abs(this.axes_mapping.crab.value) -
                        this.axes_mapping.crab.dead_zone) *
                        this.max_crab *
                        -this.axes_mapping.crab.value) /
                    (Math.abs(this.axes_mapping.crab.value) *
                        (1 - this.axes_mapping.crab.dead_zone))
                ).toFixed(3);
            }

            if (this.axes_mapping.curvature.value != 0) {
                curvature = (
                    ((Math.abs(this.axes_mapping.curvature.value) -
                        this.axes_mapping.curvature.dead_zone) *
                        this.max_curvature *
                        -this.axes_mapping.curvature.value) /
                    (Math.abs(this.axes_mapping.curvature.value) *
                        (1 - this.axes_mapping.curvature.dead_zone))
                ).toFixed(2);
            }

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
                this.send_command(false);
            }
        },
        joystics_mnvr_pt() {
            var angular_velocity = 0;

            if (this.axes_mapping.angular_velocity.value != 0) {
                angular_velocity = (
                    ((Math.abs(this.axes_mapping.angular_velocity.value) -
                        this.axes_mapping.angular_velocity.dead_zone) *
                        this.max_angular_velocity *
                        -this.axes_mapping.angular_velocity.value) /
                    (Math.abs(this.axes_mapping.angular_velocity.value) *
                        (1 - this.axes_mapping.angular_velocity.dead_zone))
                ).toFixed(2);
            }

            if (this.raw_tc != 'mnvr pt ' + angular_velocity) {
                this.raw_tc = 'mnvr pt ' + angular_velocity;
                this.send_command(false);
            }
        },
        send_command(log=true) {
            this.$emit('controller_command', [this.raw_tc, log]);
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
    },
};
</script>
