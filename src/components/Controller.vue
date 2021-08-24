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
        tc: null,
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
            base: {
                value: 0,
                dead_zone: 0.15,
                speed: 0.07,
            },
            shoulder: {
                value: 0,
                dead_zone: 0.15,
                speed: 0.07,
            },
            elbow: {
                value: 0,
                dead_zone: 0.15,
                speed: 0.07,
            },
            wrist: {
                value: 0,
                dead_zone: 0.15,
                speed: 0.07,
            },
            grabber: {
                value: 0,
                dead_zone: 0.15,
                speed: 0.07,
            },
        },
        max_rover_velocity: 0.175, //TEMP, requires rover params
        max_crab: Math.PI / 2, //TEMP
        max_curvature: 5, //TEMP
        max_angular_velocity: 1.2, //TEMP
    }),

    props: ['safe', 'mnvr_type', 'mode_type'],

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
        arm_ctrl_output() {
            return this.$store.state.tm.arm_ctrl_output;
        },
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
                14: this.button_control_mode, //DP L
                15: null, //DP R Toggle Camera
            };
        },
        axes_map() {
            return {
                0: {
                    ack: this.axes_ack_curvature,
                    basic: this.arm_base,
                }, // LS L-R [-1, 1]
                1: {
                    basic: this.arm_shoulder,
                }, // LS U-D [-1, 1]
                2: {
                    ack: this.axes_ack_crab,
                    basic: this.arm_wrist,
                }, // RS L-R [-1, 1]
                3: {
                    basic: this.arm_elbow,
                }, // RS U-D [-1, 1]
            };
        },
    },
    methods: {
        updateGamepad() {
            this.gamepad_polling = requestAnimationFrame(this.updateGamepad);
            let new_gamepad_state = navigator.getGamepads()[this.gamepad.index];

            if (this.gamepad_polling % 5 == 0 || this.mode_type == 'arm') {
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

                    if (axes !== old_axes_value || this.mode_type == 'arm') {
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
                    this.send_raw_command();
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
                    this.send_raw_command();
                }, 300);
            } else if (pressed) {
                this.raw_tc = 'safe';
                this.send_raw_command();
            } else {
                clearTimeout(this.held_button[0]);
            }
        },
        button_mnvr_type(pressed) {
            if (pressed) {
                var mnvr_change = this.mnvr_type == 'ack' ? 'pt' : 'ack';

                this.$emit('mnvr_type_change', mnvr_change);
                this.raw_tc = 'mnvr stop';
                this.send_raw_command();
            }
        },
        stop_command(pressed) {
            if (pressed) {
                this.raw_tc = 'mnvr stop';
                this.send_raw_command();
            }
        },
        button_control_mode(pressed) {
            if (pressed) {
                var mode_change = this.mode_type == 'mnvr' ? 'arm' : 'mnvr';

                this.$emit('mode_change', mode_change);
                this.raw_tc =
                    this.mode_type == 'mnvr' ? 'mnvr stop' : 'arm stop';
                this.send_raw_command();
            }
        },
        trigger_handler(value) {
            if (this.mode_type == 'mnvr') {
                if (this.mnvr_type == 'ack') {
                    if (value * this.axes_mapping.velocity.value >= 0) {
                        this.axes_ack_velocity(-value);
                    }
                } else {
                    if (value * this.axes_mapping.angular_velocity.value >= 0) {
                        this.axes_pt_angular_velocity(-value);
                    }
                }
            } else {
                if (value * this.axes_mapping.grabber.value >= 0) {
                    this.arm_grabber(-value);
                }
            }
        },
        axes_handler(axes, value) {
            var control = this.mode_type == 'mnvr' ? this.mnvr_type : 'basic';

            if (typeof this.axes_map?.[axes]?.[control] == 'function') {
                this.axes_map[axes][control](value);
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
                this.send_raw_command(false);
            }
        },
        axes_pt_command() {
            let new_raw_tc =
                'mnvr pt ' + this.axes_mapping.angular_velocity.value;

            if (this.raw_tc != new_raw_tc) {
                this.raw_tc = new_raw_tc;
                this.send_raw_command(false);
            }
        },
        arm_base(value) {
            if (Math.abs(value) > this.axes_mapping.base.dead_zone) {
                this.axes_mapping.base.value =
                    ((Math.abs(value) - this.axes_mapping.base.dead_zone) *
                        this.axes_mapping.base.speed *
                        -value) /
                        (Math.abs(value) *
                            (1 - this.axes_mapping.base.dead_zone)) +
                    this.arm_ctrl_output.pos_rad.ArmBase;
                this.axes_basic_command();
            }

        },
        arm_shoulder(value) {
            if (Math.abs(value) > this.axes_mapping.shoulder.dead_zone) {
                this.axes_mapping.shoulder.value =
                    ((Math.abs(value) - this.axes_mapping.shoulder.dead_zone) *
                        this.axes_mapping.shoulder.speed *
                        -value) /
                        (Math.abs(value) *
                            (1 - this.axes_mapping.shoulder.dead_zone)) +
                    this.arm_ctrl_output.pos_rad.ArmShoulder;

                this.axes_basic_command();
            }

        },
        arm_elbow(value) {
            if (
                Math.abs(value) > this.axes_mapping.elbow.dead_zone
            ) {
                this.axes_mapping.elbow.value = (
                    ((Math.abs(value) -
                        this.axes_mapping.elbow.dead_zone) *
                        this.axes_mapping.elbow.speed *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.elbow.dead_zone)) + this.arm_ctrl_output.pos_rad.ArmElbow
                );

                this.axes_basic_command();
            }

        },
        arm_wrist(value) {
            if (
                Math.abs(value) > this.axes_mapping.wrist.dead_zone
            ) {
                this.axes_mapping.wrist.value = (
                    ((Math.abs(value) -
                        this.axes_mapping.wrist.dead_zone) *
                        this.axes_mapping.wrist.speed *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.wrist.dead_zone)) + this.arm_ctrl_output.pos_rad.ArmWrist
                );

                this.axes_basic_command();
            }

        },
        arm_grabber(value) {
            if (
                Math.abs(value) > this.axes_mapping.grabber.dead_zone
            ) {
                this.axes_mapping.grabber.value = (
                    ((Math.abs(value) -
                        this.axes_mapping.grabber.dead_zone) *
                        this.axes_mapping.grabber.speed *
                        -value) /
                    (Math.abs(value) *
                        (1 - this.axes_mapping.grabber.dead_zone)) + this.arm_ctrl_output.pos_rad.ArmGrabber
                );

                this.axes_basic_command();
            }

        },
        axes_basic_command() {
            let new_tc = {
                ArmCmd: {
                    BasicRotation: {
                        dems: {
                            pos_rad: {
                                ArmBase: parseFloat(this.axes_mapping.base.value),
                                ArmShoulder: this.axes_mapping.shoulder.value,
                                ArmElbow: this.axes_mapping.elbow.value,
                                ArmWrist: this.axes_mapping.wrist.value,
                                ArmGrabber: this.axes_mapping.grabber.value,
                            },
                            speed_rads: {
                                ArmBase: 0,
                                ArmShoulder: 0,
                                ArmElbow: 0,
                                ArmWrist: 0,
                                ArmGrabber: 0,
                            },
                        }
                    }
                }
            }
            if (this.tc != new_tc) {
                this.tc = new_tc;
                this.send_command(false);
            }
        },
        send_raw_command(log = true) {
            this.$emit('controller_command', [this.raw_tc, log]);
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
        send_command(log = true) {
            this.$emit('controller_command', [this.tc, log]);
            this.$store.dispatch('send_tc', this.tc);
        }
    },
};
</script>
