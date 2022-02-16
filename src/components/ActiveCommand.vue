<template>
    <v-card-text class="my-2 py-0 text-h6">
        <!-- Displays the current control mode and the active command associated with the control mode -->
        <div class="text-center">{{ mode_type_conversion }}</div>
        <v-row
            v-for="(command, index) in active_command"
            v-bind:key="index"
            no-gutters
        >
            <v-col>
                <v-divider></v-divider>
                <nobr v-html="command[0]" class="px-2">{{ command[0] }}</nobr>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col>
                <v-divider></v-divider>
                <nobr class="px-2">{{ command[1] }}</nobr>
            </v-col>
        </v-row>
    </v-card-text>
</template>

<script>
export default {
    data: () => ({
        active_command: [],
    }),

    props: ['mnvr_type', 'arm_type', 'mode_type'],

    computed: {
        /**
         * Retrieves the current control mode
         * @returns Current drive or arm mode
         */
        mode_type_conversion() {
            if (this.mode_type == 'mnvr') {
                let mode = this.mnvr_type == 'ack' ? 'Ackermann' : 'Point Turn';
                return 'Drive Mode: ' + mode;
            } else {
                let mode =
                    this.arm_type == 'basic' ? 'Basic' : 'Inverse Kinematics';
                return 'Arm Mode: ' + mode;
            }
        },
    },

    methods: {
        /**
         * Formats the active command into a readable format
         * @param {string|object} command Input command sent to the rover as either string for command line TC, or object for raw TC
         */
        active_command_check(command) {
            let root = {};

            // WIP Command format for string
            // Was previously implemented in commented code below
            if (typeof command != 'object') {
                return;
            }

            // Command format for object input command
            switch (this.mode_type) {
                case 'mnvr':
                    switch (this.mnvr_type) {
                        // For Ackermann command
                        case 'ack':
                            root = Object.assign(command.LocoCtrlMnvr.Ackerman);
                            this.active_command = [
                                [
                                    'Speed (m s<sup>-1</sup>)',
                                    root.speed_ms.toFixed(2),
                                ],
                                [
                                    'Curvature (m<sup>-1</sup>)',
                                    root.curv_m.toFixed(1),
                                ],
                                ['Crab (deg)', root.crab_rad.toFixed(1)],
                            ];
                            break;
                        // For point turn command
                        case 'pt':
                            root = Object.assign(command.LocoCtrlMnvr.PointTurn);
                            this.active_command = [
                                [
                                    'Angular Velocity (deg s<sup>-1</sup>)',
                                    root.rate_rads.toFixed(1),
                                ],
                            ];
                            break;
                    }
                    break;
                case 'arm':
                    switch (this.arm_type) {
                        // For basic arm command
                        case 'basic':
                            root = Object.assign(command.ArmCmd.BasicRotation.dems.pos_rad);
                            this.active_command = [];

                            Object.keys(root).forEach(key => {
                                this.active_command.push([
                                    key.slice(3) + ' (deg)',
                                    ((root[key] * 180) / Math.PI).toFixed(1),
                                ]);
                            });
                            break;
                        // For inverse kinematics command
                        case 'ik':
                            root = Object.assign(
                                command.ArmCmd.InverseKinematics
                            );

                            this.active_command = [
                                [
                                    'Base (deg)',
                                    (
                                        (root.base_pos_rad * 180) /
                                        Math.PI
                                    ).toFixed(1),
                                ],
                                [
                                    'Horizontal (m)',
                                    root.horizontal_distance_m.toFixed(2),
                                ],
                                [
                                    'Vertical (m)',
                                    root.vertical_distance_m.toFixed(2),
                                ],
                                [
                                    'Wrist (deg)',
                                    (
                                        (root.wrist_pos_rad * 180) /
                                        Math.PI
                                    ).toFixed(1),
                                ],
                                [
                                    'Grabber (deg)',
                                    (
                                        (root.grabber_pos_rad * 180) /
                                        Math.PI
                                    ).toFixed(1),
                                ],
                            ];
                            break;
                    }
                    break;
            }
            /*if (typeof command == 'object') {
                const command_keys = Object.keys()
                let base_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmBase * 180) /
                    Math.PI;
                let shoulder_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmShoulder *
                        180) /
                    Math.PI;
                let elbow_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmElbow * 180) /
                    Math.PI;
                let wrist_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmWrist * 180) /
                    Math.PI;
                let grabber_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmGrabber *
                        180) /
                    Math.PI;
                this.active_command = [
                    ['Base (deg) ', base_angle],
                    ['Shoulder (deg) ', shoulder_angle],
                    ['Elbow (deg) ', elbow_angle],
                    ['Wrist (deg) ', wrist_angle],
                    ['Grabber (deg) ', grabber_angle],
                ];
            } else {
                command = command.split(' ');

                if (command[0] == 'mnvr') {
                    let speed = 0;
                    let curvature = 0;
                    let crab = 0;
                    let angular_velocity = 0;

                    switch (command[1]) {
                        case 'ack':
                            speed = parseFloat(command[2]);
                            curvature = parseFloat(command[3]);
                            crab = (command[4] * 180) / Math.PI;
                            this.active_command = [
                                ['Speed (m s<sup>-1</sup>) ', speed.toFixed(2)],
                                ['Crab (deg) ', crab.toFixed(1)],
                                [
                                    'Curvature (m<sup>-1</sup>) ',
                                    curvature.toFixed(1),
                                ],
                            ];
                            break;

                        case 'pt':
                            angular_velocity = (command[2] * 180) / Math.PI;
                            this.active_command = [
                                [
                                    'Angular Velocity (deg s<sup>-1</sup>) ',
                                    angular_velocity.toFixed(1),
                                ],
                            ];
                            break;
                    }
                }
            }*/
        },
    },
};
</script>
