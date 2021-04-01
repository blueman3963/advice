import styles from './index.module.scss'

import { useState } from 'react'

const Likes = (props) => {

    const {
        setStep,
        setList
    } = props

    const [ likes, setLikes ] = useState([])

    const insert = (e) => {
        if ( e.nativeEvent.key !== 'Enter' || likes.length >= 5 ) return
        setLikes([...likes, e.target.value])
        e.target.value = ''
    } 
    
    const remove = (index) => {
        let newLikes = [...likes]
        newLikes.splice(index, 1)
        setLikes(newLikes)
    }

    const submit = () => {
        if(likes.length <= 0) return
        setList(likes)
        setStep(2)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.intro}>
            Insert up to 5 things you LIKE
            </div>

            <div className={styles.tags}>
            {
                likes.map((like,index) => {
                    return <div key={index} className={styles.tag}>
                        {like} <span className={styles.remove} onClick={() => remove(index)}>&#10005;</span>
                    </div>
                })
            }
            </div>

            <input maxLength={20} onKeyDown={e => insert(e)} placeholder={'press enter to separate items'}/>
            

            <div className={`${styles.btn} ${likes.length > 0 ? styles.active:''}`} onClick={() => submit()}>Next Step</div>
        </div>
    )
}

export default Likes