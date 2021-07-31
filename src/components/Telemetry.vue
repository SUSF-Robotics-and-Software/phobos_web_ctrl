<template #label>
    <div>
        <v-card>
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
                    v-for="row in loco_ctrl_mapping()"
                    v-bind:key="row"
                >
                    <v-col sm="2.5">
                        <v-divider></v-divider>
                        {{ row }}L: {{ wheel_angles_L_deg[row] }}
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
        loco_ctrl_output() {
            return this.$store.state.tm.loco_ctrl_output;
        },
        wheel_angles_L_deg() {
            return {
                F: (
                    (this.loco_ctrl_output.pos_rad.StrFL * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.pos_rad.StrML * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.pos_rad.StrRL * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
            };
        },
        wheel_angles_R_deg() {
            return {
                F: (
                    (this.loco_ctrl_output.pos_rad.StrFR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.pos_rad.StrMR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.pos_rad.StrRR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
            };
        },
        wheel_speeds_L_degs() {
            return {
                F: (
                    (this.loco_ctrl_output.speed_rads.DrvFL * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.speed_rads.DrvML * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.speed_rads.DrvRL * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
            };
        },
        wheel_speeds_R_degs() {
            return {
                F: (
                    (this.loco_ctrl_output.speed_rads.DrvFR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                M: (
                    (this.loco_ctrl_output.speed_rads.DrvMR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
                R: (
                    (this.loco_ctrl_output.speed_rads.DrvRR * 360) /
                    (2 * Math.PI)
                ).toFixed(0),
            };
        },
    },

    methods: {
        loco_ctrl_mapping() {
            return ['F', 'M', 'R'];
        },
    },
};
</script>
