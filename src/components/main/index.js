import { useRef, useState, useEffect } from 'react'
import styles from './index.module.scss'

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import * as Pin from './models/Pin.fbx' 
import * as Earth from './models/Earth.fbx' 
import * as Plane from './models/Plane2.fbx' 

import * as cloudGeo0 from './models/Cloud_1.fbx' 
import * as cloudGeo1 from './models/Cloud_2.fbx' 
import * as cloudGeo2 from './models/Cloud_3.fbx' 
import * as cloudGeo3 from './models/Cloud_4.fbx' 

import audio_welcome from './audio/welcome.mp3'
import audio_controls from './audio/controls.mp3'
import audio_15s from './audio/15s.mp3'
import threethings from './audio/3things.mp3'
import audio_30s from './audio/30s.mp3'
import audio_tip1 from './audio/tip1.mp3'
import audio_tip2 from './audio/tip2.mp3'
import audio_realworld from './audio/realworld.mp3'
import audio_trust from './audio/trust.mp3'
import audio_exit from './audio/exit.mp3'

const cloudGeos = [
    cloudGeo0,
    cloudGeo1,
    cloudGeo2,
    cloudGeo3,
]


let camera, scene, renderer, w = window.innerWidth, h = window.innerHeight, composer

let goodClouds = [],
    badClouds = [],
    earth,
    score = []

const Main = (props) => {

    let audioTimeline = useRef(0)
    let audio = useRef()

    const gas = useRef(1)
    const gasMeter = useRef()
    const gasAlert = useRef()

    const [ scoreState, setScoreState ] = useState(0)

    let pause = useRef(false)
    const [ info, setInfo ] = useState(false)
    const [ over, setOver ] = useState(false)

    const {
        setStep,
        likesList,
        dislikesList
    } = props

    let likes = likesList
    let dislikes = dislikesList

    const wrapper = useRef()
    
    

    useEffect(() => {


        //threejs init

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

        scene = new THREE.Scene()
        scene.background = new THREE.Color( 0xdddddd )

        scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) )

        renderer = new THREE.WebGLRenderer( { antialias: true, autoSize: true } )
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap


        //control

        let unitX = 0,
            unitY = 0

        let omegaX = 0,
            omegaY = 0,
            vBase = 0.2,
            v = 0

        //world

        //earth
        earth = new THREE.Group()
        scene.add( earth )

        document.body.appendChild( renderer.domElement )

        //post processing
        composer = new EffectComposer( renderer )
        const renderPass = new RenderPass( scene, camera )
        const bokehPass = new BokehPass( scene, camera, {
            focus: 2.8,
            aperture: 0.003,
            maxblur: 0.005,
            width: w,
            height: h
        })

        composer.addPass( renderPass )
        composer.addPass( bokehPass )

        const handleResize = () => {
            
            w = window.innerWidth
            h = window.innerHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize( w, h )
            composer.setSize( w, h );
        }

        window.addEventListener('resize', handleResize)
        handleResize()

        const quaternion = new THREE.Quaternion();

        //control
        window.addEventListener('mousemove', e => {
            unitX = w/2 - e.clientX
            unitY = h/2 - e.clientY

            if(Math.abs(unitX) < 50 && Math.abs(unitY) < 50) {
                v = 0
                if(action) action.timeScale = 0
            } else {
                v = vBase
                if(action) action.timeScale = 100
            }

            omegaX = v * unitX / Math.hypot(unitX, unitY)
            omegaY = v * unitY / Math.hypot(unitX, unitY)
            
        })
        // select the X,Y world axis
        const myAxisX = new THREE.Vector3(1, 0, 0)
        const myAxisY = new THREE.Vector3(0, 1, 0)


        //scene init
        //load models
        const loader = new FBXLoader()
        let cloudGeometrys = [] 
        for(let i = 0 ; i < 4 ; i++) {
            loader.load( cloudGeos[i].default, ( object ) => {

                let model = object.children[0].geometry
                cloudGeometrys[i] = model

            })
        }
        let pinGeometry
        loader.load( Pin.default, ( object ) => {

            let model = object.children[0].geometry
            model.rotateX(1.57)
            pinGeometry = model

        })

        
        const light = new THREE.HemisphereLight( 0xffffbb, 0x080808, .5 )
        scene.add( light )

        const dlightWrapper = new THREE.Group()
        const dlight = new THREE.DirectionalLight( 0xFFFFFF, .6 )
        dlightWrapper.add( dlight )
        dlight.castShadow = true
        dlight.shadowCameraVisible = true
        dlight.shadow.mapSize.width = 1024
        dlight.shadow.mapSize.height = 1024
        dlight.shadow.camera.near = 0
        dlight.shadow.camera.far = 10
        scene.add(dlightWrapper)


        
        let earthModel
        loader.load( Earth.default, ( object ) => {
            earthModel = object.children[0]
            earth.add(earthModel)

            earth.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
        })

        //generate clouds

        

        const generateClouds = (copy, type) => {
            const isGood = type === 'good'
            let pivotPoint = new THREE.Object3D()
            const cloudGeometry = isGood ? pinGeometry : cloudGeometrys[Math.floor(Math.random()*cloudGeometrys.length)]
            
            let cloudMaterial
            if(isGood) {
                cloudMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xeeeeee,
                })
            } else {
                cloudMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x555555,
                })
            }

            const cloud = new THREE.Mesh( cloudGeometry, cloudMaterial )
            cloud.receiveShadow = true
            cloud.position.z = 3.2

            //label
            let div = document.createElement('div')
            div.className = 'text-label'
            div.style.backgroundColor = 'rgba(0,0,0,.5)'
            div.style.backdropFilter = 'blur(2px)'
            div.style.borderRadius = '10px'
            div.style.padding = '10px'
            div.style.color = 'white'
            div.style.position = 'absolute'
            div.style.width = 100
            div.style.height = 100
            div.innerHTML = isGood? likes[Math.floor(Math.random()*(likes.length))]:dislikes[Math.floor(Math.random()*(dislikes.length))]
            cloud.content = div.innerHTML
            div.style.top = -1000;
            div.style.left = -1000;
            wrapper.current.appendChild(div)

            cloud.label = div

            pivotPoint.rotation.x = (.5-Math.random())*2*Math.PI
            pivotPoint.rotation.y = (.5-Math.random())*2*Math.PI

            if(isGood) {
                earth.add(pivotPoint)
                pivotPoint.add( cloud )
            } else {
                scene.add(pivotPoint)
                pivotPoint.add( cloud )
            }

            if(isGood) {
                goodClouds.push(pivotPoint)
            } else {
                badClouds.push(pivotPoint)
            }
        }

        const get2DCoords = (position, camera) => {
            var vector = position.project(camera);
            vector.x = (vector.x + 1)/2 * window.innerWidth;
            vector.y = -(vector.y - 1)/2 * window.innerHeight;
            return vector;
        }


        //plane
        let plane, mixer, action
        loader.load( Plane.default, ( object ) => {

            plane = object

            plane.traverse( function ( child ) {
                if ( child.mesh ) {
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })

            scene.add( plane )
            plane.receiveShadow = true
            plane.castShadow = true
            plane.position.z = 3.2
            plane.rotation.x = 90
            plane.scale.set(.0004,.0004,.0004)

            mixer = new THREE.AnimationMixer( object )
            action = mixer.clipAction( object.animations[ 0 ] )
            action.timeScale = 20
            action.play()


        })



        let cloudInit = false
        let interval = null
        const initClouds = () => {
            if(cloudInit) return

            cloudInit = true
            interval = setInterval(() => {
                if(goodClouds.length >= 4 || pause.current) return
                generateClouds('text','good')
            }, 1000)

            interval = setInterval(() => {
                if(badClouds.length >= 15 || pause.current) return
                generateClouds('text','bad')
            }, 2000)

            setTimeout(() => {
                pause.current = true
                setInfo(true)
            },1000)


        }
        initClouds()



        //camera
        camera.position.z = 6

        //render loop
        const clock = new THREE.Clock()
        let time = 0
        let labelPos = new THREE.Vector3(0,0,0)

        const avoidOverlap = (mesh, coords2d, zIndex) => {
            mesh.label.style.transform = `
                translateX(${w/2 > coords2d.x ? '-100%' : '0%'})
                translateX(${w/2 > coords2d.x ? '-20px' : '20px'})
                translateY(${h/2 > coords2d.y ? '-20px' : '20px'})
            `
            if(w/2 > coords2d.x) {
                mesh.label.style.transform = 'translateX(-100%)'
            } else {
                mesh.label.style.transform = 'translateX(20px)'
            }

            if(zIndex < .5) {
                mesh.label.style.display = 'none'
            } else {
                mesh.label.style.display = 'block'
            }
        }

        let gasOff

        function animate() {
            requestAnimationFrame( animate )
            if(pause.current) return
    
            time = clock.getElapsedTime()
    
            gasOff = gas.current > 0 ? 1 : .3
    
            earth.rotateOnWorldAxis(myAxisX, THREE.Math.degToRad(omegaY*gasOff))
            earth.rotateOnWorldAxis(myAxisY, THREE.Math.degToRad(omegaX*gasOff))
            dlightWrapper.rotation.x += .01
            dlightWrapper.rotation.y += .01
    
            goodClouds.forEach((cloud, index) => {
                cloud.getWorldQuaternion(quaternion)
                if(
                    Math.abs(quaternion.x) < 0.05 &&
                    Math.abs(quaternion.y) < 0.05
                ) {
                    score.push(cloud.children[0].label.innerHTML)
                    setScoreState(score.length)
                    earth.remove( cloud )
                    goodClouds.splice(index, 1)
                    wrapper.current.removeChild(cloud.children[0].label)
                }
    
                let mesh = cloud.children[0]
                mesh.getWorldPosition( labelPos )
                let zIndex = labelPos.z
                var coords2d = get2DCoords(labelPos, camera)
                mesh.label.style.left = coords2d.x + 'px'
                mesh.label.style.top = coords2d.y + 'px'
                avoidOverlap(mesh, coords2d, zIndex)
    
            })
    
            badClouds.forEach((cloud, index) => {
                cloud.getWorldQuaternion(quaternion)
                cloud.rotateOnWorldAxis(myAxisX, THREE.Math.degToRad(omegaY*gasOff))
                cloud.rotateOnWorldAxis(myAxisY, THREE.Math.degToRad(omegaX*gasOff))
                
                if(Math.abs(cloud.rotation.x) < .1 && Math.abs(cloud.rotation.y) < .1) {
                    setOver(true)
                    pause.current = true
                }else if(Math.abs(cloud.rotation.x) < .45 && Math.abs(cloud.rotation.y) < .45) {
                    cloud.rotation.x += -cloud.rotation.x*v/28
                    cloud.rotation.y += -cloud.rotation.y*v/28
                }
    
                let mesh = cloud.children[0]
                mesh.getWorldPosition( labelPos )
                let zIndex = labelPos.z
                var coords2d = get2DCoords(labelPos, camera)
                mesh.label.style.left = coords2d.x + 'px'
                mesh.label.style.top = coords2d.y + 'px'
                avoidOverlap(mesh, coords2d, zIndex)
    
                badClouds.forEach((other, otherIndex) => {
                    let dx = other.rotation.x - cloud.rotation.x,
                        dy = other.rotation.y - cloud.rotation.y
                    if (otherIndex !== index && Math.abs(dx) < .1 && Math.abs(dy) < .1) {        
                        cloud.rotation.x -= Math.sign(dx)*(.001)
                        cloud.rotation.y -= Math.sign(dy)*(.001)
                    }
                })
    
            })
    
            if(plane && v!== 0) {
                let direcFix = 0
                if(unitY < 0) {
                    direcFix = -Math.PI
                }
                let planeDirec = Math.atan(unitX/unitY)
                plane.rotation.y = planeDirec + direcFix
            }
    
            const delta = clock.getDelta()
            if ( mixer ) mixer.update( delta )
    
            if(v !== 0 && gas.current > 0) {
                gas.current -= 5*delta
            } else if ( v === 0 && gas.current < 1) {
                gas.current += 30*delta
            }
    
            if(gas.current < 0) {
                gasAlert.current.style.display = 'block'
            } else {
                gasAlert.current.style.display = 'none'
            }
    
            gasMeter.current.style.width = gas.current*100 + '%'
    
            composer.render( delta );
    
        }
        animate()

    },[])

    const resume = () => {
        pause.current = false
        setInfo(false)
    }

    const stop = () => {
        pause.current = true
        setInfo(true)
    }
    
    const restart = () => {
        score = []
        setScoreState(0)
        audioTimeline.current = 0
        goodClouds.forEach((cloud,index) => {
            console.log(1)
            earth.remove( cloud )
            wrapper.current.removeChild(cloud.children[0].label)
        })
        badClouds.forEach((cloud,index) => {
            console.log(1)
            scene.remove( cloud )
            wrapper.current.removeChild(cloud.children[0].label)
        })

        goodClouds = []
        badClouds = []

        setOver(false)
        pause.current = false

    }

    const playAudio = (e) => {
        audio.current.pause()
        audio.current.currentTime = 0
        audio.current.src = e
        audio.current.play()
    }

    useEffect(() => {
        setInterval(() => {

            if(pause.current) return
            let timeline = audioTimeline.current
            audioTimeline.current++
            
            if( audioTimeline.current > 3 && audioTimeline.current <= 4 ) {
                playAudio(audio_welcome)

            }

            if( audioTimeline.current > 8 && audioTimeline.current <= 9 ) {
                playAudio(audio_controls)
            }

            if( audioTimeline.current > 14 && audioTimeline.current <= 15 ) {
                playAudio(audio_15s)
            }

            if( audioTimeline.current > 14 && audioTimeline.current <= 15 ) {
                playAudio(audio_15s)
            }

            if( audioTimeline.current > 22 && audioTimeline.current <= 23 ) {
                if(score.length >= 3) {
                    playAudio(threethings) 
                }
            }

            if( audioTimeline.current > 29 && audioTimeline.current <= 30 ) {
                playAudio(audio_30s) 
            } 

            if( audioTimeline.current > 38 && audioTimeline.current <= 39 ) {
                playAudio(audio_tip1) 
            }   

            if( audioTimeline.current > 46 && audioTimeline.current <= 45 ) {
                playAudio(audio_tip2) 
            }   

            if( audioTimeline.current > 58 && audioTimeline.current <= 59 ) {
                playAudio(audio_realworld) 
            }  

            if( audioTimeline.current > 64 && audioTimeline.current <= 65 ) {
                playAudio(audio_trust) 
            }  

            if( audioTimeline.current > 70 && audioTimeline.current <= 71 ) {
                playAudio(audio_exit) 
            }  

            if( audioTimeline.current > 77 && audioTimeline.current <= 78 ) {
                window.location.reload();
            }  

        },1000)
    },[])

    return (
        <>
            <div ref={wrapper}>     
            </div>
            <div className={styles.meterWrapper}>
                <div className={styles.meterOuter}>
                    <div className={styles.meterInner} ref={gasMeter}>
                    </div>
                </div>
                <div className={styles.meterLabel}>
                    {
                        info
                        ?'Ghost Active Standard'
                        :'G.A.S.'
                    }
                    
                </div>
            </div>
            <div className={styles.gasAlert} ref={gasAlert}>
                    LOW FUEL
            </div>
            {

                info &&
                <div className={styles.tips} onClick={() => resume()}>
                    <span>Move your cursor to control. Hover on plane to fuel.</span>
                    <br/>
                    tip1: Chase what you LIKE.
                    <br/>
                    tip2: Run from what you DISLIKE.
                    <br/>
                    tip3: REST when out of fuel.
                    <br/>
                    <div>
                        Resume
                    </div>
                </div>
            }
            {

                !info &&
                <div className={styles.info} onClick={() => stop()}>
                    i
                </div>
            }
            {

                over &&
                <div className={styles.tips} onClick={() => resume()}>
                    <span>Game Finished! You have achieve {scoreState} items you like. Those are {score.join(',')}</span>
                    <br/>
                    <br/>
                    tip1: Chase what you LIKE.
                    <br/>
                    tip2: Run from what you DISLIKE.
                    <br/>
                    tip3: REST when out of fuel.
                    <br/>
                    <span className={styles.ps}>
                        ☝️Maybe try these in your life?
                    </span>
                    
                    <div onClick={() => restart()}>
                        Restart
                    </div>
                </div>
            }
            <div className={styles.score}>{scoreState}</div>
            <audio ref={audio} />
        </>
    )
}

export default Main