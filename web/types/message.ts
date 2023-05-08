export enum MessageType {
    CHAT,
    FILE
};

export type MessageContent = {
    type: MessageType,
    data: string,
    author: string
}
