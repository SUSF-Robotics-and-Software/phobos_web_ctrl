<template>
    <v-card-text class="my-2 py-0 text-h6">
        <div class="text-center">Drive mode: {{ mnvr_type_conversion }}</div>
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

    props: ['mnvr_type'],

    computed: {
        mnvr_type_conversion() {
            if (this.mnvr_type == 'ack') {
                return 'Ackermann';
            } else {
                return 'Point Turn';
            }
        },
    },

    methods: {
        active_command_check(command) {
            if (typeof command == 'object') {
                let base_angle = (command.ArmCmd.BasicRotation.dems.pos_rad.ArmBase * 180) / Math.Pi;
                //console.log(typeof command.ArmCmd.BasicRotation.dems.pos_rad.ArmBase * 180, typeof Math.Pi);
                let shoulder_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmShoulder * 180) / Math.Pi;
                let elbow_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmElbow * 180) / Math.Pi;
                let wrist_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmWrist * 180) / Math.Pi;
                let grabber_angle =
                    (command.ArmCmd.BasicRotation.dems.pos_rad.ArmGrabber * 180) / Math.Pi;
                this.active_command = [
                    ['base (deg) ', base_angle],
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
                                ['speed (m s<sup>-1</sup>) ', speed.toFixed(2)],
                                ['crab (deg) ', crab.toFixed(1)],
                                ['curvature (m<sup>-1</sup>) ', curvature.toFixed(1)],
                            ];
                            break;

                        case 'pt':
                            angular_velocity = (command[2] * 180) / Math.PI;
                            this.active_command = [
                                [
                                    'Angular velocity (deg s<sup>-1</sup>) ',
                                    angular_velocity.toFixed(1),
                                ],
                            ];
                            break;
                    }
                }
            }
        },
    },
};
</script>
