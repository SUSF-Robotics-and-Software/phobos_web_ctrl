<template>
    <v-card>
        <v-card-text class="pt-0 text-center">
            <!-- Displays command log -->
            <div class="pb-3 text-h6">Log</div>
            <v-row v-for="log in command_log" v-bind:key="log.id">
                <v-col class="text-right pa-0">
                <v-divider class='py-1' />
                    <nobr class="pr-2">{{ log[0] }} s:</nobr>
                </v-col>
                <v-divider vertical />
                <v-col class="text-left pa-0">
                    <v-divider class="py-1" />
                    <nobr class="pl-2">{{ log[1] }}</nobr>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data: () => ({
        command_log: [],
        max_commands: 20,
    }),

    props: ['sim_time_s'],

    methods: {
        /**
         * Formats the last command with time
         * @param {string} last_command Last command sent to the rover
         */
        update_log(last_command) {
            this.command_log.unshift([
                this.sim_time_s.toFixed(0),
                last_command,
            ]);
            this.command_log.splice(this.max_commands);
        },
    },
};
</script>
