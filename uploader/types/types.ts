export interface Video {
    path: string
    title: string
    description: string
    tags?: string[]
    language?: string
    playlist?: string
    function?: any
    thumbnail?: string
    skipProcessingWait?: boolean
    channelName?: string
    videoVisibility: "Private" | "Unlisted" | "Public";
    uploadAsDraft?: boolean;
    isForChildren?: boolean;

    onSuccess?: (url: string) => void
    onProgress?: (arg0: VideoUploadState) => void
}

export interface VideoUploadState {
    progress: number
    progressMessage: string;
    stage: ProcessStageEnum
}

export enum ProcessStageEnum {
    Preparing,
    Configuring,
    Uploading,
    Processing,
    Done,
}

export enum UploadResult { 
    Completed,
    DailyLimitReached
}

export interface Mediator {
    onLog: (message: any) => void
    onError: (message: string) => void;
    onUserAction: (message: string) => void
    onSmsVerificationCodeSent?: () => Promise<string | undefined>
}

export interface Credentials {
    email: string
    pass: string
    recoveryEmail?: string | undefined
}
