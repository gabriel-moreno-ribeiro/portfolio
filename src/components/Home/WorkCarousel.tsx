import "swiper/css";
import "swiper/css/effect-cards";
import { EffectCards } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import img1 from "../../assets/work-carousel/img1.webp";
import img2 from "../../assets/work-carousel/img2.webp";
import img3 from "../../assets/work-carousel/img3.webp";
import img4 from "../../assets/work-carousel/img4.webp";
import img5 from "../../assets/work-carousel/img5.webp";
import img6 from "../../assets/work-carousel/img6.webp";
import img7 from "../../assets/work-carousel/img7.webp";
const images = [img1, img2, img3, img4, img5, img6, img7];

const WorkCarousel = () => {
  const mouseEnterAndExit = (enter: boolean) => {
    const customMouse = document.querySelector(".custom-mouse") as HTMLElement;
    if (customMouse) {
      if (enter) {
        customMouse.style.backgroundColor = "var(--white)";
      } else {
        customMouse.style.backgroundColor = "var(--black)";
      }
    }
  };

  return (
    <div
      className="work-carousel"
      onMouseEnter={() => mouseEnterAndExit(true)}
      onMouseLeave={() => mouseEnterAndExit(false)}
    >
      <div className="carousel-container">
        <h1 className="heading">
          Currently Working At
          <span className="blue">
            <a href="https://acciojob.com" target="_blank" rel="noreferrer">
              {" "}
              AccioJob
            </a>
          </span>{" "}
          (YC19)
        </h1>
        <p className="desc">
          AccioJob is an ed-tech startup run by IIT Delhi Alumni and backed by Y
          Combinator & Mynavi.
        </p>
        <div className="images-container">
          <Swiper
            effect={"cards"}
            grabCursor={true}
            modules={[EffectCards]}
            className="mySwiper"
          >
            {images.map((image, index) => (
              <SwiperSlide key={`${image}-${index}`}>
                <img
                  alt="work-carousel"
                  src={image}
                  className="carousel-image"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default WorkCarousel;
