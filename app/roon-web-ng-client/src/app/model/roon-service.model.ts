import { CommandState, OutputDescription } from "@model";

export type CommandCallback = (commandState: CommandState) => void;

export type OutputCallback = (outputs: OutputDescription[]) => void;
