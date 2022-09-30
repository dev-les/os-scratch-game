import { injectable, inject } from 'inversify';
import { Application, Texture } from 'pixi.js';
import TYPES from '../../types/MainConfig';
import ABaseContainer from '../AContainer/ABaseContainer';
import { StoreType } from '../../store';
import Config from '../../core/config/Config';
import AssetsLoader from '../../core/assetsLoader/AssetsLoader';
import ViewPort from '../../core/viewPort/ViewPort';
import { ScratchEntity } from '../../entities/Scratch.entity';
import { movePoint } from '../../utils/math';
import { openScratcherAction, scratchesRestoredAction, onMouseoverScratcherAction } from './actions';
import ScratchGroupEntity from '../../entities/ScratchGroup.entity';
import { RESET_SCRATCHES, ImageSize, SET_INTERACTION } from './types';
import { onClearEvent } from '../../utils/store.subscribe';
import { GET_BONUS, BonusType, END_ROUND } from '../../game/types';
import { SpriteEntity } from '../../entities/Sprite.entity';
import * as _ from 'lodash';
import * as win from '../../win.json';
import { getWinAction } from '../../game/actions';
// import { ASSETS_IS_LOADED } from '../../core/assetsLoader/types';


@injectable()
class ScratchesContainer extends ABaseContainer {

	protected name = 'SCRATCHES'
	protected app: Application
	protected frameSprite: SpriteEntity
	protected scratchEntity: ScratchEntity
	protected scratchGroupEntity: ScratchGroupEntity
	protected position: Array<number> = [0, 0];
	protected icons = new Map()
	protected bgIcons = new Map()
	

	constructor(
		@inject(TYPES.Application) app: Application,
		@inject(TYPES.Store) store: StoreType,
		@inject(TYPES.Config) config: Config,
		@inject(TYPES.AssetsLoader) assetsLoader: AssetsLoader,
		@inject(TYPES.ViewPort) viewPort: ViewPort
	) {
		super()
		this.app = app
		this.store = store
		this.config = config
		this.assetsLoader = assetsLoader
		this.viewPort = viewPort
		this.setIcons()
		this.setBgIcons()
		this.init()
	}

	protected renderContent = (): void => {
		const { position } = this;

		const bgAsset = this.assetsLoader.getResource('img/magic_forest_winner_frame')
		const framePosition = [528, 140]
		this.frameSprite = new SpriteEntity(this.viewPort, {
			texture: bgAsset.texture,
			name: 'ForestWinnerFrame',
			position: framePosition,
		});
		this.container.addChild(this.frameSprite.sprite)

		const scratchAsset = this.assetsLoader.getResource('img/magic_forest_scratch_frame_big')
		const bgRevealAsset = this.assetsLoader.getResource('img/magic_forest_frame')
		const scratchPosition = [615, 368]
		this.scratchEntity = new ScratchEntity(this.viewPort, {
			id: 0,
			renderer: this.app.renderer,
			name: 'BigScratch',
			scratchTexture: scratchAsset.texture,
			textureToReveal: bgRevealAsset.texture,
			bgTexture: bgRevealAsset.texture,
			position: movePoint(position, scratchPosition),
			contentCorrection: [180, 190, 2.3],
			onOpening: this.onOpenScratcher,
			onMouseover: this.onMouseoverScratcher,
		})
		this.container.addChild(this.scratchEntity.container)

		const scratchSmallAsset = this.assetsLoader.getResource('img/magic_forest_scratch_frame')
		this.scratchGroupEntity = new ScratchGroupEntity(this.viewPort, {
			startId: 1,
			name: 'SmallScratchesGroup',
			scratchTexture: scratchSmallAsset.texture,
			textureToReveal: bgRevealAsset.texture,
			position: movePoint(position, [78, 1232]),
			bgTexture: bgRevealAsset.texture,
			contentCorrection: [140, 135, 2.3],
			onOpening: this.onOpenScratcher,
			onMouseover: this.onMouseoverScratcher,
		})
		this.container.addChild(this.scratchGroupEntity.container)
		this.setUpScratchContainer()
		this.reRender()
	}

	protected initListeners = (): void => {
		const { subscribe } = this.store
		super.initListeners()
		// subscribe(onEvent(ASSETS_IS_LOADED, this.setUpScratchContainer.bind(this)))
		subscribe(onClearEvent(GET_BONUS, this.onOpenedScratch.bind(this)))
		subscribe(onClearEvent(RESET_SCRATCHES, this.resetAll.bind(this)))
		subscribe(onClearEvent(SET_INTERACTION, this.setInteraction.bind(this)))
		subscribe(onClearEvent(END_ROUND, this.clearAllScratches.bind(this)))
	}

	protected setInteraction(payload: { interaction: boolean }): void {
		const { interaction } = payload
		this.scratchEntity.setInteractive(interaction)
		this.scratchGroupEntity.setInteractive(interaction)
	}

	protected reRender = (): void => {
		this.frameSprite.reRender()
		this.scratchEntity.reRender()
		this.scratchGroupEntity.reRender()
	}

	protected resetAll(): void {
		const { dispatch } = this.store
		this.scratchEntity.reset()
		this.scratchGroupEntity.resetAll()
		this.viewPort.addTickOnce(() => {
			dispatch(scratchesRestoredAction())
		})
	}

	protected onMouseoverScratcher = (): void => {
		this.store.dispatch(onMouseoverScratcherAction())
	}

	protected onOpenedScratch(payload: { id: number, bonus: BonusType }): void {
		const { getResource } = this.assetsLoader
		const { id, bonus } = payload
		if (id == 0) {
			const images: Array<string> = this.config.getBonusImages(bonus)
			const texture: Texture = (images) ? getResource(images[ImageSize.BIG]).texture : null
			this.scratchEntity.setTextureToReveal(texture)
			this.scratchEntity.toOpen()
		} else {
			//const images: Array<string> = this.config.getBonusImages(bonus)
			//const texture: Texture = (images) ? getResource(images[ImageSize.SMALL]).texture : null
			// this.scratchGroupEntity.setTextureToReveal(id, texture)
			//this.scratchGroupEntity.toOpen(id)
		}
	}

	protected onOpenScratcher = (id: number): void => {
		this.store.dispatch(openScratcherAction({ id }))
	}

	protected clearAllScratches(): void {
		this.scratchEntity.clearScratch()
		this.scratchGroupEntity.toClearAll()
	}

	proccessWin(bonus: BonusType){
		const {dispatch} = this.store
		const win = this.config.getWinAmount(bonus)
		this.viewPort.addTickOnce(() => {
			dispatch(getWinAction(win))
		})
	}

	 setUpScratchContainer(): void {
		const { getResource } = this.assetsLoader
		let winnerCards = new Map();
		let winPos = null;
		const randomNum =this.randomizer();
		const prize = this.getluck(randomNum);
		if(prize != 0){
			console.log("YOU WON!")
			const bigPrize = (prize >= 5 && prize <= 8)
			const foundIcon = bigPrize ? this.bgIcons.get(prize) : this.icons.get(prize)
			this.proccessWin(foundIcon)
			const prizePos = bigPrize ? Number(this.bigPrizePos()) :Number(this.smallerPrizePos())
			winPos = bigPrize ? win['Big-win-pos'][prizePos] : win['Win-pos'][prizePos]
			winnerCards.set(winPos['a-pos'],{id:winPos['a-pos'], image:foundIcon})	
			winnerCards.set(winPos['b-pos'],{id:winPos['b-pos'], image:foundIcon})
			this.icons.delete(prize)
			if(bigPrize){
				this.bgIcons.delete(prize)
			}	
		}
		for(let id=0; id<=6; id++){
			if(winnerCards.size > 0 && winnerCards.has(id)){
				const card = winnerCards.get(id);
				const images: Array<string> = this.config.getBonusImages(card.image)
				const ImgSize = id==0 ? ImageSize.BIG :ImageSize.SMALL
				const texture: Texture = (images) ? getResource(images[ImgSize]).texture : null
				if(id == 0){
					this.scratchEntity.setTextureToReveal(texture)
					this.scratchEntity.toOpen()
				}
				else{
					this.scratchGroupEntity.setTextureToReveal(id, texture)
					this.scratchGroupEntity.toOpen(id)
				}
			}
			else{
				const card = id==0 ? this.getRandomItem(this.bgIcons) : this.getRandomItem(this.icons)
				// if(card[1].type != 7){
				const ImgSize = id==0 ? ImageSize.BIG :ImageSize.SMALL
				const images: Array<string> = this.config.getBonusImages(card[1])
				const texture: Texture = (images) ? getResource(images[ImgSize]).texture : null
				if(id == 0){
					this.scratchEntity.setTextureToReveal(texture)
					this.scratchEntity.toOpen()
					this.bgIcons.delete(card[0])
				}
				else{
					this.scratchGroupEntity.setTextureToReveal(id, texture)
					this.scratchGroupEntity.toOpen(id)
				}
				this.icons.delete(card[0])
			}
		}

	}
	 getRandomItem(set:any): any {
		let items = Array.from(set);
		return items[Math.floor(Math.random() * items.length)];
	}

	protected setIcons(){
		this.icons.set(1,  BonusType.Bonfire)//Free Shipping
		this.icons.set(2,  BonusType.Bow)//$5
		this.icons.set(3,  BonusType.Leaf)//$10
		this.icons.set(4,  BonusType.Rope)//$15
		this.icons.set(5,  BonusType.Tent)//$20
		this.icons.set(6,  BonusType.Cash)//$25
		this.icons.set(7,  BonusType.Coin)//$50
		this.icons.set(8,  BonusType.Lose)//100
		
	}

	protected setBgIcons(){
		this.bgIcons.set(5,  BonusType.Tent)//$20
		this.bgIcons.set(6,  BonusType.Cash)//$25
		this.bgIcons.set(7,  BonusType.Coin)//$50
		this.bgIcons.set(8,  BonusType.Lose)//100
	}

	protected getluck(randomNum:any): Number {
		if(randomNum <= 50){
		
		if ( randomNum > 0 && randomNum <= 30) { //30%
			//Free Shipping
			console.log(`Won Free Shipping! dice: ${randomNum}`)
			return 1//BonusType.Bonfire
		} 
		else if (randomNum > 30 && randomNum <= 40){
			//$5 Discount
			console.log(`Won $5! dice: ${randomNum}`)
			return 2//BonusType.Bow
		}
		else if (randomNum > 40 && randomNum <= 45) { //5%
			//$10 Discount
			console.log(`Won $10! dice: ${randomNum}`)
			return 3//BonusType.Leaf
		}
		else if (randomNum > 45 && randomNum <= 48) { //3%
			//$15 Discount
			console.log(`Won $15! dice: ${randomNum}`)
			return 4//BonusType.Rope
		}
		else if(randomNum > 48 && randomNum <=50){
			const randomNum2 = this.randomizer()
			if(randomNum2 < 8){ //8%
				//$100 discount
				console.log(`Won $100! dice2: ${randomNum2}`)
				return 8//BonusType.Tent
			}
			if (randomNum2 < 25){//17%
				//$50 discount
				console.log(`Won $50 dice2: ${randomNum2}`)
				return 7//BonusType.Tent
			}
			if (randomNum2 < 50){//25%
				//$25 discount
				console.log(`Won $25 dice2: ${randomNum2}`)
				return 6//BonusType.Tent
			}
			//50%
			//$20 discount
			console.log(`Won $20 dice2: ${randomNum2}`)
			return 5//BonusType.Tent
		}
	}
	else{
		console.log(`No Win dice: ${randomNum}`)
		return 0//BonusType.Lose //Lose
	}
	}

	protected randomizer(): number {
		return _.random(1, 100) // note this random have infelicity
	}
	protected smallerPrizePos(): number {
		return _.random(0, 14)
	}
	protected bigPrizePos(): number {
		return _.random(0, 5)
	}
}

export default ScratchesContainer