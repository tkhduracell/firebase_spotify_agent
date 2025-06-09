import { ref } from '@vue/composition-api';
import SpotifyWebApi from 'spotify-web-api-js'
import { useInterval } from 'vue-composable';
import { toSimple, TrackDatabase, TrackWithBPM } from './tracks';

type SpotifyApiQueue = {
    currently_playing: SpotifyApi.TrackObjectSimplified,
    queue: SpotifyApi.TrackObjectSimplified[]
}

export type Queue = {
    currently_playing: TrackWithBPM | null
    queue: TrackWithBPM[]
}

export function useQueue (client: SpotifyWebApi.SpotifyWebApiJs, db: TrackDatabase) {
    const queue = ref<Queue>();

    async function reloadQueue () {
        try {
            const result = await client.getGeneric('https://api.spotify.com/v1/me/player/queue') as SpotifyApiQueue; 
            console.log('[Queue] Loaded queue', result)
            if (result) {
                queue.value = {
                    currently_playing: 
                        result.currently_playing ?
                            await db.getTrackWithTempo(result.currently_playing.id) 
                            : null,
                    queue: result.queue ? 
                        await Promise.all(result.queue.map(async ({id}) => db.getTrackWithTempo(id)))
                        : []
                }
            }
        } catch (error) {
            console.error('[Queue] Error loading queue', error)
            queue.value = {
                currently_playing: null,
                queue: []
            }
        }
    }

    useInterval(() => {
        reloadQueue()
    }, 5_000)

    return { queue, reloadQueue }
}