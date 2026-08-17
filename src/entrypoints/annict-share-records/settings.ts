import { SETTINGS_INIT_DATA } from './constants'
import { Utils } from './utils'

export class Settings {
  static ID = 'AnnictShareRecords-Settings' as const

  #element?: HTMLElement
  #items: { [key: string]: HTMLElement } = {}

  async getElement() {
    document.getElementById(Settings.ID)?.remove()

    this.#element = document.createElement('div')
    this.#element.id = Settings.ID

    const title = document.createElement('h2')
    title.className = 'fw-bold h3 mb-0 mt-3'
    title.textContent = `${GM.info.script.name} v${GM.info.script.version}`
    this.#element.appendChild(title)

    const card = document.createElement('div')
    card.className = 'card mt-3 u-card-flat'
    this.#element.appendChild(card)

    const cardBody = document.createElement('div')
    cardBody.className = 'card-body'
    card.appendChild(cardBody)

    const settings = await Utils.getSettings()

    for (const key in SETTINGS_INIT_DATA) {
      const data = SETTINGS_INIT_DATA[key as keyof typeof SETTINGS_INIT_DATA]
      const value = settings[key as keyof typeof settings]
      const id = `${Settings.ID}-${key}`

      const div = document.createElement('div')
      div.className = 'mb-3'

      let item: HTMLElement | null = null
      let noValue: boolean = false

      if (data.type === 'text' && typeof value !== 'undefined') {
        item = this.#generate.input(id, value)
      }

      if (data.type === 'password' && typeof value !== 'undefined') {
        item = this.#generate.input(id, value, true)
      }

      if (data.type === 'textarea' && typeof value !== 'undefined') {
        item = this.#generate.textarea(id, value)
      }

      if (data.type === 'select' && data.options) {
        item = this.#generate.select(
          id,
          Object.keys(data.options).map((val) => ({
            text: data.options?.[val] ?? val,
            value: val,
            selected: val === value,
          }))
        )
      }

      if (data.type === 'divider') {
        noValue = true

        item = document.createElement('hr')
      }

      if (data.type === 'button' && data.label && data.onClick) {
        noValue = true

        item = this.#generate.button(data.label, async (e) => {
          await this.save()
          data.onClick!(e)
        })
      }

      if (item) {
        if (!noValue) {
          this.#items[key] = item

          // label
          if (data.label) {
            div.appendChild(this.#generate.label(id, data.label))
          }

          // description
          if (data.description) {
            div.appendChild(this.#generate.description(data.description))
          }
        }

        div.appendChild(item)
      }

      cardBody.appendChild(div)
    }

    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'form-submit text-center'
    buttonContainer.appendChild(
      this.#generate.button(
        '保存',
        async () => {
          await this.save()
          alert(`[${GM.info.script.name}]\n設定を保存しました`)
          location.reload()
        },
        true
      )
    )

    cardBody.appendChild(buttonContainer)

    return this.#element
  }

  async save() {
    for (const key in this.#items) {
      const item = this.#items[key]

      let value: string | null = null

      if (
        item instanceof HTMLInputElement ||
        item instanceof HTMLTextAreaElement ||
        item instanceof HTMLSelectElement
      ) {
        value = item.value.trim()
      }

      if (value != null) {
        await GM.setValue(`setting_${key}`, value)
      }
    }
  }

  #generate = {
    label(id: string, text: string) {
      const label = document.createElement('label')
      label.className = 'form-label'
      label.htmlFor = id
      label.textContent = text

      return label
    },

    input(id: string, value: string, password?: boolean) {
      const input = document.createElement('input')
      input.type = password ? 'password' : 'text'
      input.className = 'form-control'
      input.id = id
      input.value = value ?? ''
      input.autocomplete = password ? 'new-password' : 'off'

      return input
    },

    textarea(id: string, value: string) {
      const textarea = document.createElement('textarea')
      textarea.className = 'form-control'
      textarea.rows = 5
      textarea.id = id
      textarea.value = value ?? ''

      return textarea
    },

    select(
      id: string,
      options: { text: string; value: string; selected?: boolean }[]
    ) {
      const select = document.createElement('select')
      select.className = 'form-select'
      select.id = id

      for (const data of options) {
        select.appendChild(
          new Option(data.text, data.value, data.selected, data.selected)
        )
      }

      return select
    },

    button(
      text: string,
      onclick: (ev: MouseEvent) => void,
      isPrimary?: boolean
    ) {
      const button = document.createElement('button')
      button.classList.add('btn')
      if (isPrimary) {
        button.classList.add('btn-primary')
      } else {
        button.classList.add('btn-secondary')
      }
      button.textContent = text
      button.addEventListener('click', onclick)

      return button
    },

    description(text: string) {
      const div = document.createElement('div')
      div.className = 'mb-2 small text-muted'
      div.style.whiteSpace = 'pre-wrap'
      div.textContent = text

      return div
    },
  }
}
