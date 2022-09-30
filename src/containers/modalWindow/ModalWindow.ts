import { injectable, inject } from 'inversify';
import ABaseContainer from '../AContainer/ABaseContainer';
import TYPES from '../../types/MainConfig';
import { StoreType } from '../../store';
import ViewPort from '../../core/viewPort/ViewPort';
import Config from '../../core/config/Config';
import AssetsLoader from '../../core/assetsLoader/AssetsLoader';
import { SpriteEntity } from '../../entities/Sprite.entity';
import { rulesAction } from '../../game/actions';
import { hiddenModalWindowEndAction, hiddenModalWindowStartAction } from './actions';
import { onEvent } from '../../utils/store.subscribe';
import { SHOW_MODAL_WINDOW, MODAL_WINDOW_HIDDEN_START } from './types';
import { BarEntity, barEventType } from '../../entities/Bar.entity';
import { WinModalEntity } from '../../entities/WinModal.entity';
import { TIMING } from '../../core/config/types';
import { TweenMax, Circ } from 'gsap';

@injectable()
class ModalWindowContainer extends ABaseContainer {

	protected name = 'MODAL_WINDOW'
	protected position: Array<number> = [0, 0]
	protected bgEntity: SpriteEntity
	protected bgAnimation: TweenMax
	protected barEntity: BarEntity
	protected winModalEntity: WinModalEntity

	constructor(
		@inject(TYPES.Store) store: StoreType,
		@inject(TYPES.Config) config: Config,
		@inject(TYPES.AssetsLoader) assetsLoader: AssetsLoader,
		@inject(TYPES.ViewPort) viewPort: ViewPort
	) {
		super()
		this.store = store
		this.config = config
		this.assetsLoader = assetsLoader
		this.viewPort = viewPort
		this.init()
	}

	protected renderBackground = (): void => {
		const { position } = this;
		const bgAsset = this.assetsLoader.getResource('img/magic_forest_shadow_40_percent');
		this.bgEntity = new SpriteEntity(this.viewPort, {
			texture: bgAsset.texture,
			position,
		});
		this.container.addChild(this.bgEntity.sprite)

		this.bgEntity.sprite.alpha = 0
		this.bgAnimation = new TweenMax(this.bgEntity.sprite, this.config.getWaitTime(TIMING.LOW_SEC), {
			alpha: 1,
			ease: Circ.easeIn,
			// onComplete: this.onShow,
			// onReverseComplete: this.onHidden,
			paused: true,
		})
	}

	protected renderBar = (): void => {
		const barFrameAsset = this.assetsLoader.getResource('img/magic_forest_frame3')

		const btnBgAsset = this.assetsLoader.getResource('img/magic_forest_button')
		const saveAreaSize = this.viewPort.getCnfSaveAreaSize()
		this.barEntity = new BarEntity(this.viewPort, {
			speedAnimation: this.config.getWaitTime(TIMING.LOW_SEC),
			barFrameTexture: barFrameAsset.texture,
			btnBgTexture: btnBgAsset.texture,
			position: [0, saveAreaSize.height - 520],
			hidePosition: [0, saveAreaSize.height],
			onClick: this.onBarClick,
			onShow: this.onShow.bind(this),
			onHidden: this.onHide.bind(this),
		})
		this.container.addChild(this.barEntity.container)
	}

	protected onShow(): void { // note now use one timing many  animation
		this.container.visible = true
	}

	protected onHide(): void { // note now use one timing many animation
		this.container.visible = false
		this.store.dispatch(hiddenModalWindowEndAction())
	}

	protected renderWinModal(): void {
		const {getResource} = this.assetsLoader
		const bgFrameAsset = getResource('img/magic_forest_frame1')
		const coinAsset = getResource('img/magic_forest_coin_icon_small')
		const cashAsset = getResource('img/magic_forest_dollar_icon')
		const position = [15, 230]
		this.winModalEntity = new WinModalEntity(this.viewPort, {
			speedAnimation: this.config.getWaitTime(TIMING.LOW_SEC),
			bgFrame: bgFrameAsset.texture,
			position,
			hidePosition: [position[0], -1000],
			labelCorrect: [500, 100],
			coinTexture: coinAsset.texture,
			cashTexture: cashAsset.texture,
			onShow: this.onShow.bind(this),
			onHidden: this.onHide.bind(this),
		})
		this.container.addChild(this.winModalEntity.container)
	}

	protected onBarClick = (eventType: barEventType): void => {
		switch (eventType) {
			case barEventType.onPlay:
				this.hideModalWindow()
				this.store.dispatch(hiddenModalWindowStartAction())
				break
			case barEventType.howToPlay:
				this.store.dispatch(rulesAction())
				break
			default:
				throw 'Nonexistent event type'
		}
	}

	protected renderContent = (): void => {
		this.renderBackground()
		this.renderBar()
		this.renderWinModal()
	}

	protected reRender = (): void => {
		this.bgEntity.reRender()
		this.barEntity.reRender()
		this.winModalEntity.reRender()
	}

	protected render = (): void => {
		this.renderContent()
		this.reRender()
		this.initListeners()
	}

	protected initListeners() {
		super.initListeners()
		const { subscribe } = this.store
		subscribe(onEvent(SHOW_MODAL_WINDOW, () => {
			this.showModalWindow()
		}))
		subscribe(onEvent(MODAL_WINDOW_HIDDEN_START, () => {
			this.hideModalWindow()
		}))
	}

	protected showModalWindow(): void {
		this.viewPort.addTickOnce(() => {
			this.container.visible = true

			const { gameReducer, scratchesReducer } = this.store.getState()
			const haveWin = gameReducer.win.coin > 0 || gameReducer.win.cash > 0
			if(scratchesReducer.allIsOpen){
				if (haveWin) {
					const winAmount = gameReducer.win
					this.winModalEntity.setWinValue(winAmount)
					this.winModalEntity.show()
				}
				else {
					this.winModalEntity.setLoseValue()
					this.winModalEntity.show()
				}
			}

			this.barEntity.show()
			// this.bgAnimation.play()
		}, this)
	}

	protected hideModalWindow(): void {
		this.viewPort.addTickOnce(() => {
			this.barEntity.hide()
			this.winModalEntity.hide()
			this.bgAnimation.reverse()
		}, this)
	}

}

export default ModalWindowContainer