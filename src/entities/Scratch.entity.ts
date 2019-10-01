import { Container, Texture, Graphics, RenderTexture, Application, Sprite, interaction } from 'pixi.js'
import * as _ from 'lodash'
import ViewPort from "../core/viewPort/ViewPort"
import { SpriteEntity } from './Sprite.entity'
import { movePoint } from '../utils/math'

interface ScratchEntityOptions {
	name: string
	app: Application
	scratchTexture: Texture
	textureToReveal?: Texture
	position: Array<number>
	positionContentCorrection: Array<number>
}

export class ScratchEntity {

	public container: Container
	protected settings: ScratchEntityOptions
	protected viewPort: ViewPort
	protected scratchEntity: SpriteEntity
	protected brush: Graphics
	protected dragging: boolean = false
	protected renderTexture: RenderTexture
	protected imageToReveal: Sprite
	protected maskSprite: Sprite

	constructor(viewPort: ViewPort, settings: ScratchEntityOptions) {
		this.viewPort = viewPort
		this.settings = settings
		this.init()
	}

	public setTextureToReveal = (texture: Texture): void => {
		this.settings.textureToReveal = texture
		this.imageToReveal.texture = this.settings.textureToReveal
	}

	public reRender = (): void => {
		this.scratchEntity.reRender()

		const nextRatio = this.viewPort.getRatioOfSaveArea()

		const { scratchTexture, position, positionContentCorrection } = this.settings
		this.renderTexture.resize(scratchTexture.width * nextRatio, scratchTexture.height * nextRatio)
		// this.maskSprite.scale.set(nextRatio)
		this.maskSprite.width = scratchTexture.width * nextRatio
		this.maskSprite.height = scratchTexture.height * nextRatio
		const nextPosition = this.viewPort.convertPointToSaveArea(position);
		this.maskSprite.position.set(...nextPosition)

		this.imageToReveal.scale.set(nextRatio)
		const nextImagePos = this.viewPort.convertPointToSaveArea(
			movePoint(position, positionContentCorrection)
		)
		this.imageToReveal.position.set(...nextImagePos)
	}

	protected init = (): void => {

		this.container = new Container()
		this.container.name = this.settings.name || 'Scratch'

		this.brush = new Graphics()
		this.brush.name = 'brash'
		this.brush.beginFill(0xFFFFFF)
		this.brush.drawCircle(0, 0, 50)
		this.brush.endFill()

		const { scratchTexture } = this.settings
		this.renderTexture = RenderTexture.create({
			width: scratchTexture.width,
			height: scratchTexture.height,
		})

		this.renderContent()
	}

	protected renderContent = (): void => {
		const { position, scratchTexture } = this.settings
		this.scratchEntity = new SpriteEntity(this.viewPort, {
			texture: scratchTexture,
			position,
		});
		this.scratchEntity.sprite.interactive = true
		this.container.addChild(this.scratchEntity.sprite)

		this.imageToReveal = new Sprite(this.settings.textureToReveal)
		this.imageToReveal.name = 'imageToReveal'
		this.container.addChild(this.imageToReveal)

		this.maskSprite = new Sprite(this.renderTexture)
		this.maskSprite.name = 'mask'
		this.container.addChild(this.maskSprite)

		this.imageToReveal.mask = this.maskSprite

		this.initListeners()
	}

	protected initListeners = (): void => {
		const { sprite } = this.scratchEntity
		sprite.on('pointerdown', this.onPointerDown)
		sprite.on('pointerup', this.onPointerUp)
		sprite.on('pointermove', this.onPointerMove)
	}

	protected onPointerDown = (event: interaction.InteractionEvent): void => {
		this.dragging = true
		this.onPointerMove(event)
	}

	protected onPointerUp = (): void => {
		this.dragging = false
	}

	protected onPointerMove = (event: interaction.InteractionEvent): void => {
		const { app } = this.settings
		if (this.dragging) {
			const newPoint = event.data.global.clone()
			newPoint.x = event.data.global.x - this.maskSprite.position.x
			newPoint.y = event.data.global.y - this.maskSprite.position.y
			this.brush.position.copyFrom(newPoint)
			app.renderer.render(this.brush, this.renderTexture, false, null, false)
		}
	}

}