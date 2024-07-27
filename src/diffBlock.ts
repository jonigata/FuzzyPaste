import { Cursor } from "./cursor";

export interface DiffBlock {
  fullRange: [number, number]
  upperBlock: [number, number]
  lowerBlock: [number, number]
}

export interface DiffBlockCursors {
  fullRange: [Cursor, Cursor];
  upperBlock: [Cursor, Cursor];
  lowerBlock: [Cursor, Cursor];
};
