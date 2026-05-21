import React from "react";
import { Command } from "@oclif/core";
import { render } from "ink";
import { App } from "../../tui/App.js";

export default class Tui extends Command {
  static override description =
    "Launch the Forge interactive terminal UI (Ink-based).";

  static override examples = ["forge tui"];

  async run(): Promise<void> {
    const instance = render(React.createElement(App));
    await instance.waitUntilExit();
  }
}
