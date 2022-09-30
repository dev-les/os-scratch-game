import { Texture, Container } from "pixi.js"
import ViewPort from "../core/viewPort/ViewPort"
import { WinType } from "../game/types"
import { SpriteEntity } from "./Sprite.entity"
import { redWinStyle, resultWinStyle } from "./fontStyles"
import { TextEntity } from "./Text.entity"
import { movePoint } from "../utils/math"
import { TweenMax } from "gsap"

export interface WinModalEntityOptions {
	bgFrame: Texture
	name?: string
	position?: Array<number>
	hidePosition: Array<number>
	labelCorrect: Array<number>
	coinTexture: Texture
	cashTexture: Texture
	onShow: Function
	onHidden: Function
	speedAnimation: number
}

export class WinModalEntity {

	public container: Container
	protected viewPort: ViewPort
	protected settings: WinModalEntityOptions
	protected win: WinType
	protected bgFrame: SpriteEntity
	protected messageEntity: TextEntity
	protected resultCoinsEntity: TextEntity
	protected resultCacheEntity: TextEntity
	protected coinIco: SpriteEntity
	protected cashIco: SpriteEntity
	protected animation: TweenMax

	constructor(viewPort: ViewPort, settings: WinModalEntityOptions) {
		this.settings = settings
		this.viewPort = viewPort
		this.init()
	}

	public setWinValue(win: WinType): void {
		this.win = win
		// this.resultCoinsEntity.setText(String(this.win.coin))
		const freeShipping =  this.win.cash == 1
		if(freeShipping){
			this.cashIco.sprite.visible = !freeShipping
			this.resultCacheEntity.setText("Free Shipping")
			return
		}
		this.resultCacheEntity.setText(String(this.win.cash))
	}
	public setLoseValue(): void {
		this.cashIco.sprite.visible = false
		this.messageEntity.setText("NO WIN")
	}

	public reRender = (): void => {
		this.bgFrame.reRender()
		this.messageEntity.reRender()
		this.resultCacheEntity.reRender()
		this.cashIco.reRender()
	}

	public show(): void {
		this.animation.play()
	}

	public hide(): void {
		this.animation.reverse()
	}

	protected init(): void {
		this.container = new Container()
		this.container.name = this.settings.name || 'WinModalEntity'

		this.bgFrame = new SpriteEntity(this.viewPort, {
			texture: this.settings.bgFrame,
			position: this.settings.position,
		})
		this.container.addChild(this.bgFrame.sprite)

		const { position, labelCorrect, speedAnimation, hidePosition } = this.settings
		const messagePosition = movePoint(position, labelCorrect)
		this.messageEntity = new TextEntity(this.viewPort, {
			name: 'message',
			position: messagePosition,
			text: 'YOU WIN',
			style: redWinStyle
		})
		this.messageEntity.text.anchor.set(0.5, 0.5)
		this.container.addChild(this.messageEntity.text)

		// const resultCoinsPosition = movePoint(messagePosition, [-150, 120])
		// this.resultCoinsEntity = new TextEntity(this.viewPort, {
		// 	name: 'roundCoinsResult',
		// 	position: resultCoinsPosition,
		// 	text: '',
		// 	style: resultWinStyle
		// })
		// this.resultCoinsEntity.text.anchor.set(0.5, 0.5)
		// this.container.addChild(this.resultCoinsEntity.text)
		// this.coinIco = new SpriteEntity(this.viewPort, {
		// 	name: 'coinIco',
		// 	texture: this.settings.coinTexture,
		// 	position: movePoint(resultCoinsPosition, [130, 0])
		// })
		// this.coinIco.sprite.anchor.set(0.5, 0.5)
		// this.container.addChild(this.coinIco.sprite)

		const resultCachePosition = movePoint(messagePosition, [0, 120])
		this.resultCacheEntity = new TextEntity(this.viewPort, {
			name: 'roundCacheResult',
			position: resultCachePosition,
			text: '',
			style: resultWinStyle
		})
		this.resultCacheEntity.text.anchor.set(0.5, 0.5)
		this.container.addChild(this.resultCacheEntity.text)
		this.cashIco = new SpriteEntity(this.viewPort, {
			name: 'cashIco',
			texture: this.settings.cashTexture,
			position: movePoint(resultCachePosition, [-120, 0]),
		})
		this.cashIco.sprite.anchor.set(0.5, 0.5)
		this.container.addChild(this.cashIco.sprite)

		this.container.position.set(...hidePosition)
		this.animation = new TweenMax(this.container, speedAnimation, {
			y: 0,
			onComplete: this.settings.onShow,
			onReverseComplete: this.settings.onHidden,
			paused: true,
		})
	}

}