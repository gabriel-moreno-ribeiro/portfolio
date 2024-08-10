import "swiper/css";
import "swiper/css/effect-cards";
import { EffectCards } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import img1 from "../../assets/work-carousel/img1.png";
import img2 from "../../assets/work-carousel/img2.png";
import img3 from "../../assets/work-carousel/img3.png";
import img4 from "../../assets/work-carousel/img4.png";
import img5 from "../../assets/work-carousel/img5.png";
import img6 from "../../assets/work-carousel/img6.png";
import img7 from "../../assets/work-carousel/img7.png";
const images = [img1, img2, img3, img4, img5, img6, img7];

const WorkCarousel = () => {
  return (
    <div className="work-carousel">
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
