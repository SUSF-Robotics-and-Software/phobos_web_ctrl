<template>
    <v-card-text class="my-2 py-0 text-h6">
        <div class="text-center">Drive mode: {{ mnvr_type_conversion }}</div>
        <v-row v-for="(command, index) in active_command" v-bind:key="index" no-gutters>
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
            }
            else {
                return 'Point Turn'
            }
        }
    },

    methods: {
        active_command_check(command) {
            var speed = '';
            var crab = '';
            var curvature = '';
            var angular_velocity = '';

            command = command.split(' ');

            if (command[0] == 'mnvr') {
                switch (command[1]) {
                    case 'ack':
                        speed = parseFloat(command[2]);
                        curvature = parseFloat(command[3]);
                        crab = (command[4] * 360) / (2 * Math.PI);
                        this.active_command = [
                            ['speed (m s<sup>-1</sup>) ', speed.toFixed(2)],
                            ['crab (deg) ', crab.toFixed(1)],
                            ['curvature (m<sup>-1</sup>) ', curvature.toFixed(1)],
                        ];
                        break;

                    case 'pt':
                        angular_velocity = (command[2] * 360) / (2 * Math.PI);
                        this.active_command = [
                            [
                                'Angular velocity (deg s<sup>-1</sup>) ',
                                    angular_velocity.toFixed(1),
                            ],
                        ];
                        break;
                }
            }
        },
    },
};
</script>
