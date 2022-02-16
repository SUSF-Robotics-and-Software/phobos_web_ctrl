<template #label>
    <div>
        <v-card>
            <!-- Displays a table of arm motor angles -->
            <v-card-text class="py-0 text-center text-h6">
                Arm angles (deg)
                <v-divider></v-divider>
                <v-row class="text-center">
                    <v-col
                        v-for="(value, row) in arm_angles_deg"
                        v-bind:key="row"
                    >
                        {{ row }}: {{ value }}
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
export default {
    computed: {
        /**
         * @returns Current arm parameters
         */
        arm_ctrl_output() {
            return this.$store.state.tm.arm_ctrl_output;
        },
        /**
         * Arm angles converted to degrees
         * @returns Arm motor angles in degrees as Base, Shoulder, Elbow, Wrist, Grabber
         */
        arm_angles_deg() {
            return {
                Base: (
                    (this.arm_ctrl_output.pos_rad.ArmBase * 180) /
                    Math.PI
                ).toFixed(0),
                Shoulder: (
                    (this.arm_ctrl_output.pos_rad.ArmShoulder * 180) /
                    Math.PI
                ).toFixed(0),
                Elbow: (
                    (this.arm_ctrl_output.pos_rad.ArmElbow * 180) /
                    Math.PI
                ).toFixed(0),
                Wrist: (
                    (this.arm_ctrl_output.pos_rad.ArmWrist * 180) /
                    Math.PI
                ).toFixed(0),
                Grabber: (
                    (this.arm_ctrl_output.pos_rad.ArmGrabber * 180) /
                    Math.PI
                ).toFixed(0),
            };
        },
    },
};
</script>
