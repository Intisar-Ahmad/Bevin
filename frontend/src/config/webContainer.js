import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

// call only once
export const getWebContainer = async () => {
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot();
    }
    return webContainerInstance;
}