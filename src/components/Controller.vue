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
        // Parameters for each command type
        // Parameters labelled temp should be replaced with actual parameters from the rover
        axes_mapping: {
            speed_ms: {
                value: 0,
                dead_zone: 0.1,
                max: 0.175, // TEMP requires rover params
            },
            curv_m: {
                value: 0,
                dead_zone: 0.1,
                max: 5, // TEMP
            },
            crab_rad: {
                value: 0,
                dead_zone: 0.15,
                max: Math.PI / 2, // TEMP
            },
            rate_rads: {
                value: 0,
                dead_zone: 0.1,
                max: 1.2, // TEMP
            },
            base: {
                value: 0,
                dead_zone: 0.15,
                max: 0.07, // TEMP
            },
            shoulder: {
                value: 0,
                dead_zone: 0.15,
                max: 0.07, // TEMP
            },
            elbow: {
                value: 0,
                dead_zone: 0.15,
                max: 0.07, // TEMP
            },
            wrist: {
                value: 0,
                dead_zone: 0.15,
                max: 0.07, // TEMP
            },
            grabber: {
                value: 0,
                dead_zone: 0.15,
                max: 0.07, // TEMP
            },
            horizontal: {
                value: 0,
                dead_zone: 0.1,
                max: 0.1, // TEMP
            },
            vertical: {
                value: 0,
                dead_zone: 0.1,
                max: 0.1, // TEMP
            },
        },
    }),

    // Input parameters
    props: ['safe', 'mnvr_type', 'arm_type', 'mode_type'],

    // Listeners for gamepad inputs
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
        /**
         * @returns Current state of the arm
         */
        arm_ctrl_output() {
            return this.$store.state.tm.arm_ctrl_output.pos_rad;
        },
        /**
         * WIP
         * @returns Arm parameters from rover
         */
        arm_params() {
            return this.$store.state.tm.arm_params;
        },
        /**
         * @returns Object of discrete control functions to a specific button, 0 to 15
         */
        button_map() {
            return {
                0: null, //A
                1: null, //B
                2: this.mode_type_change, //X Change Drive Mode
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
                14: this.control_mode_change, //DP L
                15: null, //DP R Toggle Camera
            };
        },
        axes_map() {
            /**
             * @returns Object of continuous control functions to a specific axes, 0 to 4
             */
            return {
                0: { // LS L-R [-1, 1]
                    ack: 'curv_m',
                    basic: 'ArmBase',
                    ik: 'base_pos_rad',
                },
                1: { // LS U-D [-1, 1]
                    basic: 'ArmShoulder',
                    ik: 'horizontal_distance_m',
                },
                2: { // RS L-R [-1, 1]
                    ack: 'crab_rad',
                    basic: 'ArmWrist',
                    ik: 'wrist_pos_rad',
                },
                3: { // RS U-D [-1, 1]
                    basic: 'ArmElbow',
                    ik: 'vertical_distance_m',
                },
                4: { // Triggers L-R [-1, 1]
                    ack: 'speed_ms',
                    pt: 'rate_rads',
                    basic: 'ArmGrabber',
                    ik: 'grabber_pos_rad',
                },
            };
        },
    },
    methods: {
        /**
         * Polls the gamepad for any change in state.
         * Triggers gamepad event if a change is detected
         */
        updateGamepad() {
            // Gets current gamepad state on frame draw
            this.gamepad_polling = requestAnimationFrame(this.updateGamepad);
            let new_gamepad_state = navigator.getGamepads()[this.gamepad.index];

            // Reduces the gamepad polling rate to every 5 frame, unless it is in arm mode which requires more frequent polling
            // Temporary bugfix with rover not updating with new commands and possible performance improvements
            if (this.gamepad_polling % 5 == 0 || this.mode_type == 'arm') {
                new_gamepad_state.buttons.forEach((button, index) => {
                    const old_button_value = this.gamepad?.buttons[index].value;

                    // Checks if the button state has changed, or if it is in arm mode and triggers are active, then call button event
                    if (
                        button.value !== old_button_value ||
                        (this.mode_type == 'arm' && (index == 6 || index == 7))
                    ) {
                        // Event for pressed button
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
                        // Event for button release
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

                    // Checks if the axes have changed, or if it is in arm state, call axes event
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
        /**
         * If gamepad connects or disconnects, update gamepad list and active gamepad if active gamepad disconnects or no active gamepad present.
         * @param {object} event Gamepad object from gamepad connecting/disconnecting event
         * @param {boolean} connecting True if gamepad connected, false if disconnected
         */
        gamepadHandler(event, connecting) {
            let gamepad_event = event.gamepad;

            // If new gamepad connected and no active gamepad, set new gamepad to active
            if (connecting) {
                if (Object.keys(this.gamepads).length == 0) {
                    this.gamepad = gamepad_event;
                    this.updateGamepad();
                }

                console.log(gamepad_event.id, ' connected');
                this.gamepads[gamepad_event.index] = gamepad_event;
            // If active gamepad disconnects, clear active gamepad
            } else {
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
        /**
         * When button event is called, activate function corresponding to the activated button
         * @param {number} button Index of activated button
         * @param {number} value Value of activated button, 0 or 1 for discrete or 0 to 1 for continuos
         */
        button_handler(button, value) {
            // Invert left trigger for reverse
            if (button == 6) {
                value = -value;
            }

            if (typeof this.button_map[button] == 'function') {
                this.button_map[button](value);
            }
        },
        /**
         * Switches between safe and unsafe, toggle for safe and hold for unsafe
         * @param {boolean} pressed True if button down, false if raised
         */
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
        /**
         * Stops the rover from moving
         * @param {boolean} pressed True if button down
         */
        stop_command(pressed) {
            if (pressed) {
                this.raw_tc = 'mnvr stop';
                this.send_raw_command();
            }
        },
        /**
         * Changes between point turn and Ackermann if in manoeuver mode, or inverse kinematics and basic if in arm mode.
         * @param {boolean} pressed True if button down
         */
        mode_type_change(pressed) {
            if (pressed && this.mode_type == 'mnvr') {
                let mnvr_change = this.mnvr_type == 'ack' ? 'pt' : 'ack';

                this.$emit('mnvr_type_change', mnvr_change);
                this.raw_tc = 'mnvr stop';
            } else if (pressed) {
                let arm_change = this.arm_type == 'basic' ? 'ik' : 'basic';

                this.$emit('arm_type_change', arm_change);
                this.raw_tc = 'arm stop';
            }

            this.send_raw_command();
        },
        /**
         * Changes between manoeuver and arm mode
         * @param {boolean} pressed True if button down
         */
        control_mode_change(pressed) {
            if (pressed) {
                let mode_change = this.mode_type == 'mnvr' ? 'arm' : 'mnvr';

                this.$emit('mode_change', mode_change);
                this.raw_tc =
                    this.mode_type == 'mnvr' ? 'mnvr stop' : 'arm stop';
                this.send_raw_command();
            }
        },
        /**
         * Converts trigger buttons to an axes
         * @param {number} value Value of trigger between 0 and 1
         */
        trigger_handler(value) {
            let control = this.mode_type == 'mnvr' ? this.mnvr_type : this.arm_type;
            let name = this.axes_map[4]?.[control];

            if (name == null) return;

            if (value * this.axes_mapping[name].value >= 0 || this.mode_type == 'arm') {
                this.axes_handler(4, -value)
            }
        },
        /**
         * Calculates the adjusted value of axes and sends it to the respective control mode
         * @param {number} axes Index of activated axes
         * @param {number} value Value of activated axes
         */
        axes_handler(axes, value) {
            let control = this.mode_type == 'mnvr' ? this.mnvr_type : this.arm_type;
            let name = this.axes_map[axes]?.[control];
            console.log(this.arm_params); // TEMP for arm params WIP

            if (name == null) return;

            // For manoeuver mode, finds the corresponding parameter in the current drive mode and assigns it name
            if (this.mode_type == 'mnvr') {
                this.axes_mapping[name].value = 0;
                this.axes_value_calculation(value, name);
                this.mnvr_type == 'ack'
                    ? this.axes_ack_command()
                    : this.axes_pt_command();
            // For arm mode, finds the corresponding parameter in the current arm mode and finds it a name
            } else {
                let initial_pos_rad = this.arm_ctrl_output[
                    'Arm' + name.charAt(0).toUpperCase() + name.slice(1)
                ];
                this.axes_value_calculation(value, name, initial_pos_rad);
                this.arm_type == 'basic'
                    ? this.axes_basic_command()
                    : this.axes_ik_command();
            }
        },
        /**
         * Readjusts the axes value to a reduced range to account for dead zone, scales it for the given parameter and adds any offset for arm control.
         * Updates the axes object with new parameter values
         * @param {number} value Value of parameter
         * @param {string} name Name of parameter
         * @param {number} offset Any offset for parameter to account for shift in absolute value used in arm control
         */
        axes_value_calculation(value, name, offset = 0) {
            if (Math.abs(value) > this.axes_mapping[name].dead_zone) {
                this.axes_mapping[name].value =
                    ((Math.abs(value) - this.axes_mapping[name].dead_zone) *
                        this.axes_mapping[name].max *
                        -value) /
                        (Math.abs(value) *
                            (1 - this.axes_mapping[name].dead_zone)) +
                    offset;
            }
        },
        /**
         * Calculates new Ackermann command from parameters object
         */
        axes_ack_command() {
            /*let new_raw_tc =
                'mnvr ack ' +
                this.axes_mapping.velocity.value +
                ' ' +
                this.axes_mapping.curvature.value +
                ' ' +
                this.axes_mapping.crab.value;

            if (this.raw_tc != new_raw_tc) {
                this.raw_tc = new_raw_tc;
                this.send_raw_command(false);
            }*/
            let new_tc = {
                LocoCtrlMnvr: {
                    Ackerman: {
                        speed_ms: this.axes_mapping.speed_ms.value,
                        curv_m: this.axes_mapping.curv_m.value,
                        crab_rad: this.axes_mapping.crab_rad.value,
                    },
                },
            }

            // Creates and sends new raw TC if it is not equal to the previous command
            if (JSON.stringify(this.tc) != JSON.stringify(new_tc)) {
                this.tc = new_tc;
                this.send_command(false);
            }
        },
        /**
         * Calculates new point turn command from parameters object
         */
        axes_pt_command() {
            /*let new_raw_tc =
                'mnvr pt ' + this.axes_mapping.angular_velocity.value;

            if (this.raw_tc != new_raw_tc) {
                this.raw_tc = new_raw_tc;
                this.send_raw_command(false);
            }*/
            let new_tc = {
                LocoCtrlMnvr: {
                    PointTurn: {
                        rate_rads: this.axes_mapping.rate_rads.value,
                    },
                },
            }

            // Creates and sends new raw TC if it is not equal to the previous command
            if (JSON.stringify(this.tc) != JSON.stringify(new_tc)) {
                this.tc = new_tc;
                this.send_command(false);
            }
        },
        /**
         * Calculates new basic arm command from parameter object
         */
        axes_basic_command() {
            let new_tc = {
                ArmCmd: {
                    BasicRotation: {
                        dems: {
                            pos_rad: {
                                ArmBase: this.axes_mapping.base.value,
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
                        },
                    },
                },
            };

            // Creates and sends new raw TC if it is not equal to the previous command
            if (JSON.stringify(this.tc) != JSON.stringify(new_tc)) {
                this.tc = new_tc;
                this.send_command(false);
            }
        },
        /**
         * Calculates new inverse kinematics arm command from parameter object
         */
        axes_ik_command() {
            let new_tc = {
                ArmCmd: {
                    InverseKinematics: {
                        base_pos_rad: this.axes_mapping.base.value,
                        horizontal_distance_m: this.axes_mapping.horizontal.value,
                        vertical_distance_m: this.axes_mapping.vertical.value,
                        wrist_pos_rad: this.axes_mapping.wrist.value,
                        grabber_pos_rad: this.axes_mapping.grabber.value,
                    },
                },
            };

            // Creates and sends new raw TC if it is not equal to the previous command
            if (JSON.stringify(this.tc) != JSON.stringify(new_tc)) {
                this.tc = new_tc;
                this.send_command(false);
            }
        },
        /**
         * Sends raw TC command as a JSON object
         * @param {boolean} log Whether or not to log TC
         */
        send_raw_command(log = true) {
            this.$emit('controller_command', [this.raw_tc, log]);
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
        /**
         * Sends TC command as a string as done in the command line
         * @param {boolean} log Whether or not to log TC
         */
        send_command(log = true) {
            this.$emit('controller_command', [this.tc, log]);
            this.$store.dispatch('send_tc', this.tc);
        },
    },
};
</script>
