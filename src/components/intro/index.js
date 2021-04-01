import styles from './index.module.scss'

const Intro = (props) => {

    const {
        setStep
    } = props

    return (
        <div className={styles.wrapper}>
            <span>
                Earth {Math.random().toFixed(5)}
            </span>
            <div className={styles.btn} onClick={() => setStep(1)}>Next Step</div>
        </div>
    )
}

export default Intro