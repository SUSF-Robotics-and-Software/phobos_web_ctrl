<template>
    <v-app>
        <!-- Webpage header -->
        <v-app-bar app color="primary" dark dense>
            <v-toolbar-title>Phobos Web Control</v-toolbar-title>

            <v-spacer></v-spacer>

            <span>Rover Time: {{ sim_time_s }} s</span>
        </v-app-bar>

        <v-main>
            <v-container fluid>
                <!-- Main webpage split into 3 columns -->
                <v-row no-gutters>
                    <!-- 1st column: Rover control -->
                    <v-col sm="4">
                        <!--
                            Safe button
                            Switches state of rover between safe and unsafe
                            When is safe, displays reason for safe state
                        -->
                        <v-btn
                            block
                            v-bind:color="safe ? 'green' : 'red'"
                            elevation="3"
                            x-large
                            @click="safe_button(safe)"
                        >
                            <div>
                                {{ safe ? 'SAFE' : 'STOP' }}<br />
                                <div class="caption">{{ safe_cause }}</div>
                            </div>
                        </v-btn>
                        <!-- Shows current active command -->
                        <v-card>
                            <div
                                v-for="command in active_command"
                                v-bind:key="command.id"
                            >
                                {{ command[0] }} {{ command[1] }}
                            </div>
                        </v-card>
                        <!-- Terminal control for rover -->
                        <TextTcInput
                            @command_sent="
                                active_command_check($event)
                            "
                        />
                        <!--  -->
                        <Controller
                            :safe="safe"
                            @controller_command="
                                active_command_check($event[0], $event[1])
                            "
                        />
                    </v-col>
                    <v-col sm="6">
                        <v-card align="end">
                            <CamImageView />
                        </v-card>
                        <div>
                            <Telemetry />
                        </div>
                    </v-col>
                    <v-col sm="2">
                        <v-card>
                            <v-row
                                v-for="log in command_log"
                                v-bind:key="log.id"
                                class="px-5"
                            >
                                {{ log[0] }}: {{ log[1] }}
                            </v-row>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
//TODO Fix Ackermann wheels angle
//TODO Add button map rather than hard bound
//TODO Don't display mnvr commands in log
//TODO Make more components
//TODO Comment

import TextTcInput from './components/TextTcInput';
import CamImageView from './components/CamImageView';
import Telemetry from './components/Telemetry.vue';
import Controller from './components/Controller.vue';

export default {
    name: 'App',

    components: {
        TextTcInput,
        CamImageView,
        Telemetry,
        Controller,
    },

    data: () => ({
        command_log: [],
        active_command: [],
        max_commands: 20,
    }),

    created() {
        this.$store.dispatch('connect_tc');
        this.$store.dispatch('connect_tm');
    },

    computed: {
        sim_time_s() {
            return parseFloat(this.$store.state.tm.sim_time_s.toFixed(2));
        },
        safe() {
            return `${this.$store.state.tm.safe}` === 'true';
        },
        safe_cause() {
            return `${this.$store.state.tm.safe_cause}`;
        },
    },

    methods: {
        send() {
            this.$store.dispatch('send_raw_tc', this.raw_tc);
        },
        safe_button(safe) {
            this.raw_tc = safe ? 'unsafe' : 'safe';
            this.send();
        },
        update_log(last_command) {
            this.command_log.unshift([
                this.sim_time_s.toFixed(0),
                last_command,
            ]);
            this.command_log.splice(this.max_commands);
        },
        active_command_check(command, log=true) {
            var speed = '';
            var crab = '';
            var curvature = '';
            var angular_velocity = '';

            if (log) {
                this.update_log(command);
            }

            command = command.split(' ');

            if (command[0] == 'mnvr') {
                switch (command[1]) {
                    case 'ack':
                        speed = parseFloat(command[2]);
                        curvature = parseFloat(command[3]);
                        crab = (command[4] * 360) / (2 * Math.PI);
                        this.active_command = [
                            ['speed (m/s):', speed.toFixed(2)],
                            ['crab (deg):', crab.toFixed(1)],
                            ['curvature (/m):', curvature.toFixed(1)],
                        ];
                        break;

                    case 'pt':
                        angular_velocity = (command[2] * 360) / (2 * Math.PI);
                        this.active_command = [
                            [
                                'Angular velocity (deg/s):',
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
