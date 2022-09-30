import ViewPort from "../core/viewPort/ViewPort"
import { Sprite, Texture, Container, Text, TextStyle } from 'pixi.js'
import { btnLabelStyle, btnOrangeStyle } from "./fontStyles"
import { SpriteEntity } from "./Sprite.entity"
import { TweenMax } from 'gsap'

export enum barEventType {
	onPlay = 'onPlay',
	howToPlay = 'howToPlay',
}
export interface BarEntityOptions {
	barFrameTexture: Texture
	btnBgTexture: Texture
	onClick?: Function
	onShow: Function
	onHidden: Function
	name?: string
	position?: Array<number>
	hidePosition: Array<number>
	speedAnimation: number
}

export class BarEntity {

	public container: Container
	protected viewPort: ViewPort
	protected settings: BarEntityOptions
	protected frameSprite: SpriteEntity
	protected btnBgPlaySprite: Sprite
	protected btnPlayPosition: Array<number> = [25, 235]
	protected btnPlayText: Text
	protected btnPlayLabelPosition: Array<number> = [500, 285]
	protected linkRulesText: Text
	protected linkRulesLabelPosition: Array<number> = [350, 115]
	protected speedAnimation: number
	protected animation: TweenMax

	constructor(viewPort: ViewPort, settings: BarEntityOptions) {
		this.settings = settings
		this.viewPort = viewPort
		this.init()
	}

	public show(): void {
		this.animation.play()
	}

	public hide(): void {
		this.animation.reverse()
	}

	public reRender = (): void => {
		const { position } = this.settings
		const nextRatio = this.viewPort.getRatioOfSaveArea()
		this.frameSprite.reRender()

		this.btnBgPlaySprite.position.set(...this.viewPort.convertPointToSaveArea(position, this.btnPlayPosition))
		this.btnBgPlaySprite.scale.set(nextRatio)

		this.btnPlayText.style.fontSize = Number(btnLabelStyle.fontSize) * nextRatio
		this.btnPlayText.position.set(...this.viewPort.convertPointToSaveArea(position, this.btnPlayLabelPosition))

		this.linkRulesText.style.fontSize = Number(btnLabelStyle.fontSize) * nextRatio
		this.linkRulesText.position.set(...this.viewPort.convertPointToSaveArea(position, this.linkRulesLabelPosition))
	}

	public onClick = (eventType: string, payload?: any): void => {
		this.settings.onClick && this.settings.onClick(eventType, payload)
	}

	protected init = (): void => {
		this.container = new Container()
		this.container.name = 'Bar'
		this.renderContent()
	}

	protected initListeners = (): void => {
		this.btnBgPlaySprite.on('pointerdown', (e: any) => {
			this.onClick(barEventType.onPlay, e)
		})

		this.linkRulesText.on('pointerdown', (e: any) => {
			this.onClick(barEventType.howToPlay, e)
		})
	}

	protected renderContent = (): void => {
		this.frameSprite = new SpriteEntity(this.viewPort, {
			texture: this.settings.barFrameTexture,
			position: this.settings.position,
		})
		this.btnBgPlaySprite = new Sprite(this.settings.btnBgTexture)
		this.btnBgPlaySprite.interactive = true
		this.btnBgPlaySprite.buttonMode = true

		this.btnPlayText = new Text('Play', new TextStyle(btnLabelStyle))
		this.btnPlayText.name = 'Play for 60'

		this.linkRulesText = new Text('How To Play', new TextStyle(btnOrangeStyle))
		this.linkRulesText.name = 'How To Play'
		this.linkRulesText.interactive = true
		this.linkRulesText.buttonMode = true

		this.container.addChild(this.frameSprite.sprite)
		this.container.addChild(this.linkRulesText)
		this.container.addChild(this.btnBgPlaySprite)
		this.container.addChild(this.btnPlayText)

		const { hidePosition, speedAnimation } = this.settings
		this.container.position.set(...hidePosition)
		this.animation = new TweenMax(this.container, speedAnimation, {
			y: 0,
			onComplete: this.settings.onShow,
			onReverseComplete: this.settings.onHidden,
			paused: true,
		})


		this.initListeners()
	}

}