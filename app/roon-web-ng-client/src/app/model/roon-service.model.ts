import { CommandState, OutputDescription } from "@nihilux/roon-web-model";

export type CommandCallback = (commandState: CommandState) => void;

export type OutputCallback = (outputs: OutputDescription[]) => void;
