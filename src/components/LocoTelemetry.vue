<template #label>
    <div>
        <v-card>
            <!-- Displays a table of rover wheel speeds and angles -->
            <v-card-text class="py-0 text-center text-h6">
                <v-row>
                    <v-col sm="5">
                        Wheel angles (deg)
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col sm="5">
                        Wheel speeds (deg s<sup>-1</sup>)
                    </v-col>
                </v-row>
                <v-row
                    no-gutters
                    v-for="(left_wheel_angles, row) in wheel_angles_L_deg"
                    v-bind:key="row"
                >
                    <v-col sm="2.5">
                        <v-divider></v-divider>
                        {{ row }}L: {{ left_wheel_angles }}
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col sm="2.5">
                        <v-divider></v-divider>
                        {{ row }}R: {{ wheel_angles_R_deg[row] }}
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col sm="2.5">
                        <v-divider></v-divider>
                        {{ row }}L: {{ wheel_speeds_L_degs[row] }}
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col sm="2.5">
                        <v-divider></v-divider>
                        {{ row }}R: {{ wheel_speeds_R_degs[row] }}
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
         * @returns Current wheel parameters
         */
        loco_ctrl_output() {
            return this.$store.state.tm.loco_ctrl_output;
        },
        /**
         * Left wheel angles converted to degrees
         * @returns {object} Left wheel angles in degrees as F (front), M (middle), R (rear)
         */
        wheel_angles_L_deg() {
            return {
                F: (
                    (this.loco_ctrl_output.pos_rad.StrFL * 180) /
                    Math.PI
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.pos_rad.StrML * 180) /
                    Math.PI
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.pos_rad.StrRL * 180) /
                    Math.PI
                ).toFixed(0),
            };
        },
        /**
         * Right wheel angles converted to degrees
         * @returns {object} Right wheel angles in degrees as F (front), M (middle), R (rear)
         */
        wheel_angles_R_deg() {
            return {
                F: (
                    (this.loco_ctrl_output.pos_rad.StrFR * 180) /
                    Math.PI
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.pos_rad.StrMR * 180) /
                    Math.PI
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.pos_rad.StrRR * 180) /
                    Math.PI
                ).toFixed(0),
            };
        },
        /**
         * Left wheel speeds converted to degrees per second
         * @returns {object} Left wheel speeds in degrees per second as F (front), M (middle), R (rear)
         */
        wheel_speeds_L_degs() {
            return {
                F: (
                    (this.loco_ctrl_output.speed_rads.DrvFL * 180) /
                    Math.PI
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.speed_rads.DrvML * 180) /
                    Math.PI
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.speed_rads.DrvRL * 180) /
                    Math.PI
                ).toFixed(0),
            };
        },
        /**
         * Right wheel speeds converted to degrees per second
         * @returns {object} Right wheel speeds in degrees per second as F (front), M (middle), R (rear)
         */
        wheel_speeds_R_degs() {
            return {
                F: (
                    (this.loco_ctrl_output.speed_rads.DrvFR * 180) /
                    Math.PI
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.speed_rads.DrvMR * 180) /
                    Math.PI
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.speed_rads.DrvRR * 180) /
                    Math.PI
                ).toFixed(0),
            };
        },
    },
};
</script>
