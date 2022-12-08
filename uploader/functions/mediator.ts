import { Mediator } from "../types/types.js";

export const defaultMediator: Mediator = {
  onLog: console.log,
  onError: console.log,
  onUserAction: console.log
}