import { injectable, inject } from 'inversify';
import BackgroundContainer from '../containers/background/Background.container';
import TYPES from '../types/MainConfig';
import { StoreType } from '../store';
import { renderBackgroundAction, reRenderBackgroundAction } from '../containers/background/action';
import CharContainer from '../containers/char/Char.container';
import { renderCharAction, reRenderCharAction } from '../containers/char/action';
import ViewPort from '../core/viewPort/ViewPort';
import { onEvent } from '../utils/store.subscribe';
import { VIEW_PORT_RESIZE_ACTION } from '../core/viewPort/types';
import { reRenderWinUpAction, renderWinUpAction } from '../containers/winUp/actions';
import WinUpContainer from '../containers/winUp/WinUp';
import ScratchesContainer from '../containers/scratches/Scratches.containers';
import * as scratchesAction from '../containers/scratches/actions';
import * as notificationActions from '../containers/notification/actions';
import NotificationContainer from '../containers/notification/Notification';
import ModalWindowContainer from '../containers/modalWindow/ModalWindow';
import * as modalWindowActions from '../containers/modalWindow/actions';
import { INIT_START_GAME_STAGE } from './types';
import { initiatedStartGameAction } from './action';

@injectable()
class StartGameStage {

	protected store: StoreType;
	protected viewPort: ViewPort;
	protected backgroundContainer: BackgroundContainer;
	protected charContainer: CharContainer;
	protected winUpContainer: WinUpContainer;
	protected scratchesContainer: ScratchesContainer;
	protected notificationContainer: NotificationContainer;
	protected modalWindowContainer: ModalWindowContainer;

	constructor(
		@inject(TYPES.Store) store: StoreType,
		@inject(TYPES.ViewPort) viewPort: ViewPort,
		@inject(TYPES.BackgroundContainer) backgroundContainer: BackgroundContainer,
		@inject(TYPES.CharContainer) charContainer: CharContainer,
		@inject(TYPES.WinUpContainer) winUpContainer: WinUpContainer,
		@inject(TYPES.ScratchesContainer) scratchesContainer: ScratchesContainer,
		@inject(TYPES.NotificationContainer) notificationContainer: NotificationContainer,
		@inject(TYPES.ModalWindowContainer) modalWindowContainer: ModalWindowContainer,
	) {
		this.store = store
		this.viewPort = viewPort
		this.backgroundContainer = backgroundContainer
		this.charContainer = charContainer
		this.winUpContainer = winUpContainer
		this.scratchesContainer = scratchesContainer
		this.notificationContainer = notificationContainer
		this.modalWindowContainer = modalWindowContainer
		this.initListeners();
	}

	protected initScreen() {
		const { dispatch } = this.store
		const { scene } = this.viewPort

		scene.addChild(this.backgroundContainer.view)
		// scene.addChild(this.charContainer.view)
		scene.addChild(this.winUpContainer.view)
		scene.addChild(this.scratchesContainer.view)
		scene.addChild(this.notificationContainer.view)
		scene.addChild(this.modalWindowContainer.view)

		dispatch(renderBackgroundAction())
		dispatch(renderCharAction())
		dispatch(renderWinUpAction())
		dispatch(scratchesAction.renderAction())
		dispatch(notificationActions.renderAction())
		dispatch(modalWindowActions.renderAction())

		this.viewPort.addTickOnce(this.initiatedScreen.bind(this))
	}

	protected initiatedScreen() {
		const { dispatch } = this.store
		dispatch(modalWindowActions.showModalWindowAction())
		this.viewPort.addTickOnce(() => {
			dispatch(initiatedStartGameAction())
		})
	}

	protected initListeners(): void {
		const { subscribe, dispatch } = this.store
		subscribe(onEvent(VIEW_PORT_RESIZE_ACTION, () => {
			dispatch(reRenderBackgroundAction())
			dispatch(reRenderCharAction())
			dispatch(reRenderWinUpAction())
			dispatch(scratchesAction.reRenderAction())
			dispatch(notificationActions.reRenderAction())
			dispatch(modalWindowActions.reRenderAction())
		}))
		subscribe(onEvent(INIT_START_GAME_STAGE, this.initScreen.bind(this)))
		subscribe
	}

}

export default StartGameStage
