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
                            <ActiveCommand
                                ref="ActiveCommand"
                                :mnvr_type="mnvr_type"
                            />
                        </v-card>
                        <!-- Terminal control for rover -->
                        <TextTcInput
                            @command_sent="active_command_check($event)"
                        />
                    </v-col>
                    <v-col sm="6">
                        <v-card align="end">
                            <CamImageView />
                        </v-card>
                        <div>
                            <LocoTelemetry />
                            <ArmTelemetry />
                        </div>
                    </v-col>
                    <v-col sm="2">
                        <CommandLog ref="UpdateLog" :sim_time_s="sim_time_s" />
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
        <!--  -->
        <Controller
            :safe="safe"
            :mnvr_type="mnvr_type"
            :mode_type="mode_type"
            @controller_command="active_command_check($event[0], $event[1])"
            @mnvr_type_change="mnvr_type = $event"
            @mode_change="mode_type = $event"
        />
    </v-app>
</template>

<script>
//TODO Implement arm control
//TODO Fix Ackermann wheels angle during crab & curvature
//TODO Settings menu
//TODO Comment

// Basic Arm Control Map
// LS L-R Base
// LS U-D Shoulder
// RS L-R Wrist
// RS U-D Elbow
// Triggers Claw

import TextTcInput from './components/TextTcInput';
import CamImageView from './components/CamImageView';
import LocoTelemetry from './components/LocoTelemetry';
import ArmTelemetry from './components/ArmTelemetry';
import Controller from './components/Controller';
import ActiveCommand from './components/ActiveCommand';
import CommandLog from './components/CommandLog';

export default {
    name: 'App',

    components: {
        TextTcInput,
        CamImageView,
        LocoTelemetry,
        ArmTelemetry,
        Controller,
        ActiveCommand,
        CommandLog,
    },

    data: () => ({
        mnvr_type: 'ack',
        mode_type: 'mnvr',
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
        active_command_check(command, log = true) {
            this.$refs.ActiveCommand.active_command_check(command);
            if (log) {
                this.$refs.UpdateLog.update_log(command);
            }
        },
    },
};
</script>
