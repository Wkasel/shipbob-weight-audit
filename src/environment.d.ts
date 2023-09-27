declare global {

    interface ProcessEnv {
        NODE_ENV?: 'development' | 'production';
        SHIPBOB_API_TOKEN: string;
    }
}


export { };
