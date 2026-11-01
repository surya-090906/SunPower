// Native React page. Data contract: backoffice/survey_form.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  ActionForm,
  CsrfField,
  Partial,
  PhotoUploader,
  UploadTile,
  PhotoCount,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/field/"}>
            {"‹ My day"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{"Site survey"}</h1>
          <div className={"sub"}>
            {data.v1}
            {" · "}
            {data.v2}
            {" · "}
            {data.v3}
          </div>
        </div>
      </div>
      {"\n"}
      <ActionForm
        method={"post"}
        style={cssStyle("max-width:720px")}
        className={"stack"}
      >
        <CsrfField />
        {"\n  "}
        <div className={"card"}>
          <div className={"card-b"}>
            {"\n    "}
            <h3 className={"mb-s"}>{"Measurements"}</h3>
            {"\n    "}
            <div className={"fields"}>
              {"\n      "}
              <FieldGroup className={"field full"}>
                <label>{"Which way does the roof face?"}</label>
                <div className={"row"}>
                  {data.rows4?.length ? (
                    data.rows4.map((row4, index) => (
                      <Fragment key={index}>
                        <label
                          className={"btn btn-line"}
                          style={cssStyle("min-width:56px")}
                        >
                          <Field
                            type={"radio"}
                            name={"direction"}
                            value={text(row4.v5)}
                            {...(row4.attr6 === 0 ? { checked: true } : {})}
                            required={true}
                            style={cssStyle("margin-right:.35rem")}
                          />
                          {row4.v7}
                        </label>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </div>
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Roof tilt (degrees)"}</label>
                <Field
                  className={"inp"}
                  name={"tilt"}
                  value={text(data.v8)}
                  inputMode={"numeric"}
                  placeholder={"18"}
                  required={true}
                />
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Usable shadow-free area (sq ft)"}</label>
                <Field
                  className={"inp"}
                  name={"area"}
                  value={text(data.v9)}
                  inputMode={"numeric"}
                  required={true}
                />
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Cable run, array to inverter (m)"}</label>
                <Field
                  className={"inp"}
                  name={"cable"}
                  value={text(data.v10)}
                  inputMode={"numeric"}
                  required={true}
                />
                <span className={"hint"}>
                  {"Sets the cable length on the quote."}
                </span>
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Roof type"}</label>
                <div className={"row"}>
                  <label className={"btn btn-line"}>
                    <Field
                      type={"radio"}
                      name={"roof"}
                      value={"rcc"}
                      {...(data.attr11 === 0 ? { checked: true } : {})}
                      required={true}
                      style={cssStyle("margin-right:.35rem")}
                    />
                    {"RCC"}
                  </label>
                  <label className={"btn btn-line"}>
                    <Field
                      type={"radio"}
                      name={"roof"}
                      value={"tin"}
                      {...(data.attr12 === 0 ? { checked: true } : {})}
                      style={cssStyle("margin-right:.35rem")}
                    />
                    {"Tin shed"}
                  </label>
                </div>
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field full"}>
                <label>{"Shading"}</label>
                <div className={"row"}>
                  <label className={"btn btn-line"}>
                    <Field
                      type={"radio"}
                      name={"shading"}
                      value={"none"}
                      {...(data.attr13 === 0 ? { checked: true } : {})}
                      required={true}
                      style={cssStyle("margin-right:.35rem")}
                    />
                    {"None"}
                  </label>
                  <label className={"btn btn-line"}>
                    <Field
                      type={"radio"}
                      name={"shading"}
                      value={"partial"}
                      {...(data.attr14 === 0 ? { checked: true } : {})}
                      style={cssStyle("margin-right:.35rem")}
                    />
                    {"Partial"}
                  </label>
                  <label className={"btn btn-line"}>
                    <Field
                      type={"radio"}
                      name={"shading"}
                      value={"heavy"}
                      {...(data.attr15 === 0 ? { checked: true } : {})}
                      style={cssStyle("margin-right:.35rem")}
                    />
                    {"Heavy"}
                  </label>
                </div>
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field full"}>
                <label>{"Notes"}</label>
                <TextArea className={"inp"} name={"notes"}>
                  {data.v16}
                </TextArea>
              </FieldGroup>
              {"\n    "}
            </div>
            {"\n  "}
          </div>
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-b"}>
            {"\n    "}
            <div className={"spread mb-s"}>
              <h3>{"Photos"}</h3>
              <span className={"small muted"}>
                <PhotoCount data-photo-count={true}>{data.v17}</PhotoCount>
                {" added, at least "}
                {data.v18}
                {" needed"}
              </span>
            </div>
            {"\n    "}
            <PhotoUploader
              className={"thumbs"}
              data-uploader={true}
              data-url={"/app/field/photo/"}
              data-target={"survey"}
              data-id={text(data.v19)}
            >
              {"\n      "}
              {data.rows20?.length ? (
                data.rows20.map((row20, index) => (
                  <Fragment key={index}>
                    <div className={"thumb"}>
                      <img src={text(row20.v21)} alt={""} />
                      <span className={"k"}>{row20.v22}</span>
                    </div>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n      "}
              <UploadTile className={"upload-tile"} data-kind={"roof"}>
                <Field
                  type={"file"}
                  accept={"image/*"}
                  capture={"environment"}
                  hidden={true}
                  multiple={true}
                />
                <span style={cssStyle("font-size:1.4rem")}>{"📷"}</span>
                {"Roof"}
              </UploadTile>
              {"\n      "}
              <UploadTile className={"upload-tile"} data-kind={"meter"}>
                <Field
                  type={"file"}
                  accept={"image/*"}
                  capture={"environment"}
                  hidden={true}
                  multiple={true}
                />
                <span style={cssStyle("font-size:1.4rem")}>{"📷"}</span>
                {"Meter / DB"}
              </UploadTile>
              {"\n    "}
            </PhotoUploader>
            {"\n  "}
          </div>
        </div>
        {"\n  "}
        <button className={"btn btn-primary btn-lg btn-block"}>
          {"Submit survey"}
        </button>
        {"\n"}
      </ActionForm>
      {"\n"}
    </>
  );
}
