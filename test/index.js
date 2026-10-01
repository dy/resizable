import Resizable from '../resizable.js'

const card = document.querySelector('#card')
const dimensions = document.querySelector('#dimensions')
const resizable = new Resizable(card, { within: 'parent', draggable: true, threshold: 2 })

const update = () => {
  const { width, height } = card.getBoundingClientRect()
  dimensions.textContent = `${Math.round(width)} × ${Math.round(height)}`
}

resizable.on('resize', update)
update()

document.querySelector('.install button').addEventListener('click', async (event) => {
  await navigator.clipboard.writeText('npm install resizable')
  event.currentTarget.textContent = 'Copied!'
  setTimeout(() => { event.currentTarget.textContent = 'Copy' }, 1400)
})
