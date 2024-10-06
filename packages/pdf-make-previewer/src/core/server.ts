import express, { type Express, type Response } from "express"
import path from "node:path"
import colors from "picocolors"
import { getConfig } from "src/lib/builder"
import type { SharedData } from "./types"

export function createServer(
  configPath: string,
  port: number,
  clients: Response[],
): Express {
  const app = express()

  app.use(express.static(path.join(__dirname)))

  app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
  })

  app.get("/events", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    clients.push(res)

    const config = await getConfig(process.cwd(), configPath)

    if (!config) {
      console.log(
        `${colors.green(`${colors.bold("[PDF MAKE PREVIEWER]")}`)} ${colors.red("No config file found or invalid config file")}\n`,
      )
      process.exit(1)
    }

    const functionString = config.renderPdfPreview()

    const initialData: SharedData = {
      previewData: functionString,
      message: "Initial preview data",
    }

    res.write(`data: ${JSON.stringify(initialData)}\n\n`)

    console.log(
      `  ${colors.green(`${colors.bold("[PDF MAKE PREVIEWER]")}`)} ${colors.cyan("client connect 👋")}`,
    )

    req.on("close", () => {
      const index = clients.indexOf(res)
      if (index !== -1) {
        clients.splice(index, 1)
      }
    })
  })

  return app
}
