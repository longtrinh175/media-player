import React from 'react';
import { Text, View, Slider, TouchableHighlight } from 'react-native';
import * as Icon from '@expo/vector-icons'
import { Audio } from 'expo'

class PlayItem{
	constructor(name, source) {
		this.name = name
		this.source = source
	}
}

const PLAYLIST = [
	new PlayItem(
		'con trai cung - BRay',
		require('./assets/contraicung.mp3')
	),
	new PlayItem(
		'co sao gio lai chia xa - Bich Phuong',
		require('./assets/cosaogiolaichiaxa.mp3')
	),
	new PlayItem(
		'vo nguoi ta - Phan Manh Quynh',
		require('./assets/vonguoita.mp3')
	),
	new PlayItem(
		'Gao ranger - Tossai',
		require('./assets/gaoranger.mp3')
	)
]

const LOADING_STRING = 'loading...'

export default class App extends React.Component {
	constructor(props) {
		super(props)
		this.index = 0
		this.playbackInstance = null
		this.isSeeking = false
		this.shouldPlayAtEndOfSeek = false
		this.state = {
			playbackInstanceName: LOADING_STRING,
			playbackInstanceDuration: null,
			playbackInstancePosition: null,
			isLoading: false,
			shouldPlay: false,
			isPlaying: false,
			volume: 1.0
		}
	}
	// load lan dau
	componentDidMount() {
		Audio.setAudioModeAsync({
			playsInSilentModeIOS: false,
			allowsRecordingIOS: false,
			shouldDuckAndroid: true,
			playThroughEarpieceAndroid: false,
			interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
			interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS
		})
		this._loadNewPlaybackInstance(false)
	}
	//load am thanh
	_loadNewPlaybackInstance = async (playing) => {
		if (this.playbackInstance != null) {
			await this.playbackInstance.unloadAsync()
			this.playbackInstance.setOnPlaybackStatusUpdate(null)
			this.playbackInstance = null
		}

		const source = PLAYLIST[this.index].source
		const initialStatus = {
			shouldPlay: playing,
			volume: this.state.volume
		}

		const { sound, status } = await Audio.Sound.createAsync(
			source,
			initialStatus,
			this._onPlaybackStatusUpdate
		)

		this.playbackInstance = sound
		this._updateScreenForLoading(false)
	}
	// load hinh anh
	_updateScreenForLoading = isLoading => {
		if (isLoading) {
			this.setState(prevState => {
				return {
					playbackInstanceName: LOADING_STRING,
					playbackInstanceDuration: null,
					playbackInstancePosition: null,
					isLoading: true,
					isPlaying: false
				}
			})
		} else {
			this.setState(prevState => {
				return {
					playbackInstanceName: PLAYLIST[this.index].name,
					isLoading: false
				}
			})
		}
	}
	// call back nhan status cua am thanh
	_onPlaybackStatusUpdate = status => {
		if (status.isLoaded) { // load am thanh thanh cong
			this.setState(prevState => {
				return {
					playbackInstancePosition: status.positionMillis,
					playbackInstanceDuration: status.durationMillis,
					shouldPlay: status.shouldPlay,
					isPlaying: status.isPlaying,
					volume: status.volume
				}
			}) // ket thuc nhay qua bai khac va tiep tuc chay
			if (status.disJustFinish) {
				this._advanceIndex(true),
				this._updatePlaybackForIndex(true)
			}
		} else {
			if (status.error) {
				console.log(`FATAL ERROR: ${this.status.error}`)
			}
		}
	}
	// 2 ham duoi dung de update bai hat tiep theo
	_advanceIndex = forward => {
		this.index = (this.index + (forward ? 1 : (PLAYLIST.length - 1))) % PLAYLIST.length
	}

	_updatePlaybackForIndex = async (playing) => {
		this._updateScreenForLoading(true)
		this._loadNewPlaybackInstance(playing)
	}

	_onPlayPausePressed = () => {
		if (this.playbackInstance != null) {
			if (this.state.isPlaying) {
				this.playbackInstance.pauseAsync()
			} else {
				this.playbackInstance.playAsync()
			}
		}
	}

	_onStopPressed = () => {
		if (this.playbackInstance != null) {
			this.playbackInstance.stopAsync()
		}
	}

	_onBackPressed = () => {
		if (this.playbackInstance != null) {
			this._advanceIndex(false),
			this._updatePlaybackForIndex(this.state.shouldPlay)
		}
	}

	_onForwardPressed = () => {
		if (this.playbackInstance != null) {
			this._advanceIndex(true)
			this._updatePlaybackForIndex(this.state.shouldPlay)
		}
	}

	_onSeekSliderValueChange = value => {
		if (this.playbackInstance != null && !this.isSeeking) {
			this.isSeeking = true
			this.shouldPlayAtEndOfSeek = this.state.shouldPlay
			this.playbackInstance.pauseAsync()
		}
	}

	_onSeekSliderSlidingComplete = async (value) => {
		if (this.playbackInstance != null) {
			this.isSeeking = false
			const seekPosition = value * this.state.playbackInstanceDuration
			if (this.shouldPlayAtEndOfSeek) {
				this.playbackInstance.playFromPositionAsync(seekPosition)
			} else {
				this.playbackInstance.setPositionAsync(seekPosition)
			}
		}
	}


	_getSeekSliderPosition = () => {
		if (
			this.playbackInstance != null &&
			this.state.playbackInstanceDuration != null &&
			this.state.playbackInstancePosition != null
		) {
			return (
				this.state.playbackInstancePosition /
				this.state.playbackInstanceDuration
			)
		}
		return 0
	}

	_getMMSFromMillis = millis => {
		const totalSeconds = millis / 1000
		const seconds = Math.floor(totalSeconds % 60)
		const minutes = Math.floor(totalSeconds / 60)

		const padWithZero = number => {
			const string =  number.toString()
			if (number < 10) {
				return '0' + string
			} else {
				return string
			}
		}

		return padWithZero(minutes) + ':' + padWithZero(seconds)
	}

	_getTimeStamp = () => {
		if (
			this.playbackInstance != null &&
			this.state.playbackInstanceDuration != null &&
			this.state.playbackInstancePosition != null
		) {
			return `${this._getMMSFromMillis(this.state.playbackInstancePosition)} / ${this._getMMSFromMillis(this.state.playbackInstanceDuration)}`
		}
		return ''
	}

	render() {
		return(
			<View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
				<View style={{ alignItems: "center"}}>
					<Text style={{fontWeight: 'bold', fontSize: 18}}>{this.state.playbackInstanceName}</Text>
				</View>
				<View style={{ alignItems: "center"}}>
					<Text>{this._getTimeStamp()}</Text>
				</View>
				<Slider 
					value={this._getSeekSliderPosition()}
					onValueChange={this._onSeekSliderValueChange}
					onSlidingComplete={this._onSeekSliderSlidingComplete}
				/>
				<View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
					<TouchableHighlight onPress={this._onStopPressed}>
						<View>
							<Icon.FontAwesome name='stop' size={30} color='gray'/>
						</View>
					</TouchableHighlight>
					<TouchableHighlight onPress={this._onBackPressed}>
						<View>
							<Icon.AntDesign name='stepbackward' size={30} color='gray'/>
						</View>
					</TouchableHighlight>
					<TouchableHighlight onPress={this._onPlayPausePressed}>
						<View>
							{this.state.isPlaying
								? <Icon.FontAwesome name='pause' size={30} color='gray'/>
								: <Icon.FontAwesome name='play' size={30} color='gray'/>
							}
						</View>
					</TouchableHighlight>
					<TouchableHighlight onPress={this._onForwardPressed}>
						<View>
							<Icon.AntDesign name='stepforward' size={30} color='gray'/>
						</View>
					</TouchableHighlight>
				</View>
				<Slider 
					value={1}
					onSlidingComplete={this._onVolumeSliderValueChange}	
				/>
			</View>
		)
	}
}

//chung ta co cac thao tac co ban sau.
// load am thanh va load hinh anh.
// bao gom load lan dau, cac lan sau load theo index. dung index de xac dinh bai hat.
//tao noi chua am thanh va hinh anh.
// lan dau chung ta load am thanh va hinh anhr