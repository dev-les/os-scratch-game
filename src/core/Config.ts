import { injectable } from 'inversify';

export interface GSettings {
	assetsImgPath: string;
	assetsImages: Array<string>;
	size: string;
	[key: string]: any;
}

@injectable()
class Config {

	protected settings: GSettings

	constructor(settings: GSettings) {
		this.settings = settings;
	}


	public set(key: string, value: any) {
		this.settings[key] = value;
	}

	public get(key: string) {
		return this.settings[key];
	}

	public getAssetsList(): Array<string> {
		return this.settings.assetsImages;
	}

	public getAssetsImgPath(): string {
		return this.settings.assetsImgPath;
	}

}

export default Config;