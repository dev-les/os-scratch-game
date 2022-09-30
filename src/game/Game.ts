import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import TYPES from '../types/MainConfig';
import Config from '../core/config/Config';
import AssetsLoader from '../core/assetsLoader/AssetsLoader';
import { StoreType } from '../store';
import { ASSETS_IS_LOADED } from '../core/assetsLoader/types';
import { onEvent, onClearEvent } from '../utils/store.subscribe';
import StartGameStage from '../stages/StartGame.stage';
import ViewPort from '../core/viewPort/ViewPort';
import {  OPEN_SCRATCH, SCRATCHES_RESTORED } from '../containers/scratches/types';
import { endRound, playAction, getWinAction, startRoundAction } from './actions';
import { initStartGameAction } from '../stages/action';
import { INITIATED_START_GAME_STAGE } from '../stages/types';
import { showModalWindowAction } from '../containers/modalWindow/actions';
import { MODAL_WINDOW_HIDDEN_END } from '../containers/modalWindow/types';
import { END_ROUND, GET_BONUS, BonusType, GET_WIN } from './types'
import { resetScratchesAction, setInteractionScratchesAction } from '../containers/scratches/actions';
import { TIMING } from '../core/config/types';

@injectable()
class Game {

	protected store: StoreType;
	protected config: Config;
	protected assetsLoader: AssetsLoader;
	protected startGameStage: StartGameStage;
	protected viewPort: ViewPort;

	constructor(
		@inject(TYPES.Store) store: StoreType,
		@inject(TYPES.Config) config: Config,
		@inject(TYPES.AssetsLoader) assetsLoader: AssetsLoader,
		@inject(TYPES.ViewPort) viewPort: ViewPort,
		@inject(TYPES.StartGameStage) startGameStage: StartGameStage,
	) {
		this.store = store;
		this.config = config;
		this.assetsLoader = assetsLoader;
		this.viewPort = viewPort;
		this.startGameStage = startGameStage;

		this.initListeners();
	}

	public launch(): void {
		this.assetsLoader.load()
	}

	protected initListeners(): void {
		const { subscribe } = this.store
		subscribe(onEvent(ASSETS_IS_LOADED, this.initStage))
		subscribe(onEvent(INITIATED_START_GAME_STAGE, this.toResetScratches.bind(this)))
		subscribe(onEvent(MODAL_WINDOW_HIDDEN_END, this.toStartRound.bind(this)))
		subscribe(onEvent(SCRATCHES_RESTORED, this.toPlayGame.bind(this)))
		subscribe(onClearEvent(OPEN_SCRATCH, this.openScratch.bind(this)))
		subscribe(onClearEvent(GET_BONUS, this.onGetBonus.bind(this)))
		subscribe(onEvent(GET_WIN, this.onGetWin.bind(this)))
		subscribe(onEvent(END_ROUND, this.toShowPlayBar.bind(this)))
	}

	protected initStage = (): void => {
		this.store.dispatch(initStartGameAction())
	}

	protected toPlayGame(): void {
		this.store.dispatch(playAction())
	}

	protected toShowPlayBar(): void {
		const { dispatch } = this.store
		dispatch(setInteractionScratchesAction({ interaction: false }))
		this.viewPort.addTickOnce(() => {
			dispatch(showModalWindowAction())
		})
	}

	protected toStartRound(): void {
		const { dispatch } = this.store
		dispatch(startRoundAction())
		dispatch(setInteractionScratchesAction({ interaction: true }))
		this.viewPort.addTickOnce(() => {
			dispatch(resetScratchesAction())
		})
	}

	protected toResetScratches(): void {
		const { dispatch } = this.store
		dispatch(resetScratchesAction())
	}

	protected openScratch(): void {
		const { scratchesReducer } = this.store.getState()
		const { dispatch } = this.store
		if (scratchesReducer.allIsOpen) {
			this.viewPort.addTickOnce(() => {
				_.delay(() => {
					dispatch(endRound())
				}, this.config.getWaitTime(TIMING.MEDIUM))
			})
		}
	}

	protected onGetBonus(payload: { id: number, bonus: BonusType }): void {
		const { dispatch } = this.store
		const win = this.config.getWinAmount(payload.bonus)
		this.viewPort.addTickOnce(() => {
			dispatch(getWinAction(win))
		})
	}

	protected onGetWin(): void {
		const { scratchesReducer } = this.store.getState()
		const { dispatch } = this.store
		if (scratchesReducer.allIsOpen) {
			this.viewPort.addTickOnce(() => {
				_.delay(() => {
					dispatch(endRound())
				}, this.config.getWaitTime(TIMING.MEDIUM))
			})
		}
	}

	protected generateBonusForWinner(): BonusType {
		const dice = this.toDice()
		if (dice <= 20) {   // 20%
			return BonusType.Cash
		} else {           // 80%
			return BonusType.Coin
		}
	}

	protected generateBonusForCard(): BonusType {
		const dice = this.toDice() // TODO move this ratio to settings
		if (dice <= 2) {   // 2%
			return BonusType.Tent
		}
		if (dice <= 4) { // 4%
			return BonusType.Rope
		}
		if (dice <= 6) { // 6%
			return BonusType.Leaf
		}
		if (dice <= 8) { // 8%
			return BonusType.Bow
		}
		if (dice <= 10) { // 10% 
			return BonusType.Bonfire
		}
		return BonusType.Lose // 70%
	}

	protected getluck(): BonusType {
		const dice = this.toDice()
		if (dice <= 30) { //30%
			//Free Shipping
			console.log(`Won Free Shipping! dice: ${dice}`)
			return BonusType.Bonfire
		} 
		if (dice <= 40) { //10%
			//$5 Discount
			console.log(`Won $5! dice: ${dice}`)
			return BonusType.Bow
		}
		if (dice <= 45) { //5%
			//$10 Discount
			console.log(`Won $10! dice: ${dice}`)
			return BonusType.Leaf
		}
		if (dice <= 48) { //3%
			//$15 Discount
			console.log(`Won $15! dice: ${dice}`)
			return BonusType.Rope
		}
		if (dice <= 50) { //2%
			//$10 Discount
			const dice2 = this.toDice()
			if(dice2 < 8){ //8%
				//$100 discount
				console.log(`Won $100! dice2: ${dice2}`)
				return BonusType.Tent
			}
			if (dice2 < 25){//17%
				//$50 discount
				console.log(`Won $50 dice2: ${dice2}`)
				return BonusType.Tent
			}
			if (dice2 < 50){//25%
				//$25 discount
				console.log(`Won $25 dice2: ${dice2}`)
				return BonusType.Tent
			}
			//50%
			//$20 discount
			console.log(`Won $20 dice2: ${dice2}`)
			return BonusType.Tent
		}
		console.log(`No Win dice: ${dice}`)
		return BonusType.Lose //Lose
	}

	protected toDice(): number {
		return _.random(1, 100) // note this random have infelicity
	}

}

export default Game;
