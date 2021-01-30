<template>
    <v-app>
        <v-app-bar app color="primary" dark dense>
            <v-toolbar-title>Phobos Web Control</v-toolbar-title>

            <v-spacer></v-spacer>

            <span>Rover Time: {{ sim_time_s }}</span>
        </v-app-bar>

        <v-main>
            <CamImageView />
            <TextTcInput />
        </v-main>
    </v-app>
</template>

<script>
import TextTcInput from './components/TextTcInput';
import CamImageView from './components/CamImageView';

export default {
    name: 'App',

    components: {
        TextTcInput,
        CamImageView,
    },

    data: () => ({
        //
    }),

    created() {
        this.$store.dispatch('connect_tc');
        this.$store.dispatch('connect_tm');
    },

    computed: {
        sim_time_s() {
            return `${this.$store.state.tm.sim_time_s.toFixed(2)} s`;
        },
    },
};
</script>
