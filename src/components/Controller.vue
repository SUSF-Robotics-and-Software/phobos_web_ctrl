<template>
    <div />
</template>

<script>
export default {
    data: () => ({
        gamepads: [],
        held_button: [],
        gamepad: null,
        gamepad_polling: null,
        raw_tc: '',
        axes_mapping: {
            velocity: {
                value: 0,
                dead_zone: 0.1,
            },
            crab: {
                value: 0,
                dead_zone: 0.15,
            },
            curvature: {
                value: 0,
                dead_zone: 0.1,
            },
            angular_velocity: {
                value: 0,
                dead_zone: 0.1,
            },
        },
        max_rover_velocity: 0.175, //TEMP, requires rover params
        max_crab: Math.PI / 2, //TEMP
        max_curvature: 5, //TEMP
        max_angular_velocity: 1.2, //TEMP
    }),

    props: ['safe', 'mnvr_type'],

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
            this.button_handler(e.detail.buttonIndex, e.detail.buttonValue);
        });
        document.addEventListener('gamepadButtonUp', e => {
            this.button_handler(e.detail.buttonIndex, 0);
        });
        document.addEventListener('gamepadAxesChange', e => {
            this.axes_handler(e.detail.axesIndex, e.detail.axesValue);
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
                6: this.trigger_handler, //LT
                7: this.trigger_handler, //RT
                8: null, //View
                9: null, //Menu
                10: null, //LS
                11: null, //RS
                12: this.toggle_safe, //DP U Toggle Safe
                13: this.stop_command, //DP D Command Stop
                14: null, //DP L
                15: null, //DP R Toggle Camera
            };
        },
        axes_map() {
            return {
                0: {
                    ack: this.axes_ack_curvature,
                }, // LS L-R [-1, 1]
                1: null, // LS U-D [-1, 1]
                2: {
                    ack: this.axes_ack_crab,
                }, // RS L-R [-1, 1]
                3: null, // RS U-D [-1, 1]
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

                new_gamepad_state.axes.forEach((axes, index) => {
                    const old_axes_value = this.gamepad?.axes[index];

                    if (axes !== old_axes_value) {
                        document.dispatchEvent(
                            new CustomEvent('gamepadAxesChange', {
                                detail: {
                                    axesIndex: index,
                                    axesValue: axes,
                                },
                            })
                        );
                    }
                });

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
                    this.raw_tc = 'safe';
                    this.send_command();
                }
            }

            console.log('Active gamepad index:', this.gamepad?.index);
            console.log('Gamepads:', this.gamepads);
        },
        button_handler(button, value) {
            if (button == 6) {
                value = -value;
            }

            if (typeof this.button_map[button] == 'function') {
                this.button_map[button](value);
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
                var mnvr_change = this.mnvr_type == 'ack' ? 'pt' : 'ack';

                this.$emit('mnvr_type_change', mnvr_change);
                this.raw_tc = 'mnvr stop';
                this.send_command();
            }
        },
        stop_command(pressed) {
            if (pressed) {
                this.raw_tc = 'mnvr stop';
                this.send_command();
            }
        },
        trigger_handler(value) {
            if (this.mnvr_type == 'ack') {
                if (value * this.axes_mapping.velocity.value >= 0) {
                    this.axes_ack_velocity(-value);
                }
            } else {
                if (value * this.axes_mapping.angular_velocity.value >= 0) {
                    this.axes_pt_angular_velocity(-value);
                }
            }
        },
        axes_handler(axes, value) {
            if (typeof this.axes_map?.[axes]?.[this.mnvr_type] == 'function') {
                this.axes_map[axes][this.mnvr_type](value);
            }
        },
        axes_ack_velocity(value) {
            this.axes_mapping.velocity.value = 0;

            if (Math.abs(value) > this.axes_mapping.velocity.dead_zone) {
                this.axes_mapping.velocity.value = (
                    ((Math.abs(value) - this.axes_mapping.velocity.dead_zone) *
                        this.max_rover_velocity *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.velocity.dead_zone))
                ).toFixed(3);
            }

            this.axes_ack_command();
        },
        axes_ack_curvature(value) {
            this.axes_mapping.curvature.value = 0;

            if (Math.abs(value) > this.axes_mapping.curvature.dead_zone) {
                this.axes_mapping.curvature.value = (
                    ((Math.abs(value) - this.axes_mapping.curvature.dead_zone) *
                        this.max_curvature *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.curvature.dead_zone))
                ).toFixed(2);
            }

            this.axes_ack_command();
        },
        axes_ack_crab(value) {
            this.axes_mapping.crab.value = 0;

            if (Math.abs(value) > this.axes_mapping.crab.dead_zone) {
                this.axes_mapping.crab.value = (
                    ((Math.abs(value) - this.axes_mapping.crab.dead_zone) *
                        this.max_crab *
                        -value) /
                    (Math.abs(value) * (1 - this.axes_mapping.crab.dead_zone))
                ).toFixed(3);
            }

            this.axes_ack_command();
        },
        axes_pt_angular_velocity(value) {
            this.axes_mapping.angular_velocity.value = 0;

            if (
                Math.abs(value) > this.axes_mapping.angular_velocity.dead_zone
            ) {
                this.axes_mapping.angular_velocity.value = (
                    ((Math.abs(value) -
                        this.axes_mapping.angular_velocity.dead_zone) *
                        this.max_angular_velocity *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.angular_velocity.dead_zone))
                ).toFixed(2);
            }

            this.axes_pt_command();
        },
        axes_ack_command() {
            let new_raw_tc =
                'mnvr ack ' +
                this.axes_mapping.velocity.value +
                ' ' +
                this.axes_mapping.curvature.value +
                ' ' +
                this.axes_mapping.crab.value;

            if (this.raw_tc != new_raw_tc) {
                this.raw_tc = new_raw_tc;
                this.send_command(false);
            }
        },
        axes_pt_command() {
            let new_raw_tc =
                'mnvr pt ' + this.axes_mapping.angular_velocity.value;

            if (this.raw_tc != new_raw_tc) {
                this.raw_tc = new_raw_tc;
                this.send_command(false);
            }
        },
        send_command(log = true) {
            this.$emit('controller_command', [this.raw_tc, log]);
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
    },
};
</script>
