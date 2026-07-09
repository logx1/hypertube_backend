import styles from "./Slider.module.css";
import { useState } from "react";
import { useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import PrimaryButton from "../Button/PrimaryButton";

// const items = new Array(10).fill(null);

interface SliderProps {
  name?: string;
  production_year?: string;
  cover_image?: string;
  rating?: number;
  linkToOpen?: string;
}

export default function Slider({ items }: { items: SliderProps[] }) {
  // const [items, setItems] = useState<any>(new Array(10).fill(null));
  const scrollBox = useRef<any>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  console.log(items);
  // console.log(items.length);

  const goNext = () => {
    console.log("okay go next");
    // console.log(scrollBox.current);
    scrollBox.current.scrollBy({ left: 100 });
    if (currentIdx < items.length - 1)
      setCurrentIdx((currentIdx) => currentIdx + 1);
  };

  const goPrev = () => {
    scrollBox.current.scrollBy({ left: -100 });
    if (currentIdx > 0) setCurrentIdx((currentIdx) => currentIdx - 1);
  };

  const gotoIndx = (idx: number) => {
    scrollBox.current.scrollBy({ left: 100 * idx + 1 });
    setCurrentIdx(idx);
  };

  return (
    <div className={styles.sliderContainer}>
      <button
        className={`${styles.sliderNavigationButton} ${styles.nextBtn}`}
        onClick={goNext}
      >
        Next
      </button>
      <button
        className={`${styles.sliderNavigationButton} ${styles.prevBtn}`}
        onClick={goPrev}
      >
        Prev
      </button>
      <div className={styles.sliderNavigationItems}>
        {items.map((ele, idx) => {
          return (
            <button
              className={`${styles.sliderNavigationItem} ${currentIdx >= idx ? styles.activeItem : ""}`}
              key={uuidv4()}
              onClick={() => {
                // gotoIndx(idx);
              }}
            ></button>
          );
        })}
      </div>
      <div className={styles.sliderWrapper} ref={scrollBox}>
        <div
          className={styles.sliderHolder}
          style={{
            width: `calc(${items.length} * 100%)`,
            gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          }}
        >
          {items.map((ele: any, idx: any) => {
            return (
              <div
                key={idx}
                className={styles.sliderItem}
                style={{
                  backgroundImage: `url(${ele.cover_image})`,
                }}
              >
                <div className={styles.sliderItemShadow}></div>
                <div className={styles.sliderItemContent}>
                  <p className={styles.sliderItemTitle}>{ele.name}</p>
                  <p className={styles.sliderItemDescription}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Nesciunt itaque eligendi facilis ut dolores dolor id eveniet
                    unde consectetur, esse iste nisi ipsam libero voluptatem
                    dolore ratione nam tempora placeat.
                  </p>
                  <div className={styles.sliderButtonContainer}>
                    <PrimaryButton
                      text="Watch now"
                      width="300px"
                      padding="15px 0px"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
