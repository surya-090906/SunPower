// Native React page. Data contract: backoffice/install_form.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  ActionForm,
  CsrfField,
  SignaturePad,
  PhotoUploader,
  UploadTile,
  PhotoCount,
  WizardStep,
  WizardHead,
  WizardButton,
  GeoButton,
  GeoStatus,
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
          <h1 style={cssStyle("margin-top:.3rem")}>{"Install form"}</h1>
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
        className={"wizard"}
        data-wizard={true}
        data-start={text(data.v4)}
        style={cssStyle("max-width:720px")}
      >
        <CsrfField />
        {"\n  "}
        <WizardHead className={"wiz-head"}>
          <span>{"1 Checklist"}</span>
          <span>{"2 Time and size"}</span>
          <span>{"3 Photos"}</span>
          <span>{"4 Sign-off"}</span>
        </WizardHead>
        {"\n\n  "}
        <WizardStep className={"step"}>
          <div className={"card"}>
            <div className={"card-b"}>
              {"\n    "}
              <h3 className={"mb-s"}>{"Work completed"}</h3>
              {"\n    "}
              <div className={"checklist"}>
                {data.rows5?.length ? (
                  data.rows5.map((row5, index) => (
                    <Fragment key={index}>
                      <label>
                        <Field
                          type={"checkbox"}
                          name={text(row5.v6)}
                          {...(row5.attr7 === 0 ? { checked: true } : {})}
                        />
                        {row5.v8}
                      </label>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
              </div>
              {"\n    "}
              <WizardButton
                className={"btn btn-primary btn-lg btn-block mt"}
                data-next={true}
                type={"button"}
              >
                {"Next"}
              </WizardButton>
              {"\n  "}
            </div>
          </div>
        </WizardStep>
        {"\n\n  "}
        <WizardStep className={"step"}>
          <div className={"card"}>
            <div className={"card-b"}>
              {"\n    "}
              <div className={"fields"}>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label>{"Started"}</label>
                  <Field
                    className={"inp"}
                    type={"datetime-local"}
                    name={"started_at"}
                    value={text(data.v9)}
                    required={true}
                  />
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label>{"Finished"}</label>
                  <Field
                    className={"inp"}
                    type={"datetime-local"}
                    name={"finished_at"}
                    value={text(data.v10)}
                    required={true}
                  />
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label>{"System size installed (kW)"}</label>
                  <Field
                    className={"inp"}
                    name={"kw"}
                    value={text(data.v11)}
                    inputMode={"decimal"}
                    required={true}
                  />
                  <span className={"hint"}>
                    {"Quoted: "}
                    {data.v12}
                    {" kW"}
                  </span>
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label>{"Generation test reading (kW)"}</label>
                  <Field
                    className={"inp"}
                    name={"reading"}
                    value={text(data.v13)}
                    inputMode={"decimal"}
                    placeholder={"2.6"}
                    required={true}
                  />
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field full"}>
                  <label>{"If the size differs from the quote, why?"}</label>
                  <Field
                    className={"inp"}
                    name={"kw_note"}
                    value={text(data.v14)}
                  />
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field full"}>
                  <label>{"Who was on site?"}</label>
                  {data.rows15?.length ? (
                    data.rows15.map((row15, index) => (
                      <Fragment key={index}>
                        <label
                          className={"check"}
                          style={cssStyle("padding:.3rem 0")}
                        >
                          <Field
                            type={"checkbox"}
                            name={"present"}
                            value={text(row15.v16)}
                            checked={true}
                          />
                          <span>
                            {row15.v17}
                            {row15.choice18 === 0 ? <>{" (lead)"}</> : null}
                          </span>
                        </label>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </FieldGroup>
                {"\n    "}
              </div>
              {"\n    "}
              <div className={"row mt"}>
                <WizardButton
                  className={"btn btn-line"}
                  data-prev={true}
                  type={"button"}
                >
                  {"Back"}
                </WizardButton>
                <WizardButton
                  className={"btn btn-primary grow btn-lg"}
                  data-next={true}
                  type={"button"}
                >
                  {"Next"}
                </WizardButton>
              </div>
              {"\n  "}
            </div>
          </div>
        </WizardStep>
        {"\n\n  "}
        <WizardStep className={"step"}>
          <div className={"card"}>
            <div className={"card-b"}>
              {"\n    "}
              <div className={"spread mb-s"}>
                <h3>{"Photos of the finished roof"}</h3>
                <span className={"small muted"}>
                  <PhotoCount data-photo-count={true}>{data.v19}</PhotoCount>
                  {" added, at least "}
                  {data.v20}
                  {" needed"}
                </span>
              </div>
              {"\n    "}
              <PhotoUploader
                className={"thumbs"}
                data-uploader={true}
                data-url={"/app/field/photo/"}
                data-target={"job"}
                data-id={text(data.v21)}
              >
                {"\n      "}
                {data.rows22?.length ? (
                  data.rows22.map((row22, index) => (
                    <Fragment key={index}>
                      <div className={"thumb"}>
                        <img src={text(row22.v23)} alt={""} />
                        <span className={"k"}>{row22.v24}</span>
                      </div>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
                {"\n      "}
                {data.rows25?.length ? (
                  data.rows25.map((row25, index) => (
                    <Fragment key={index}>
                      <UploadTile
                        className={"upload-tile"}
                        data-kind={text(row25.v26)}
                      >
                        <Field
                          type={"file"}
                          accept={"image/*"}
                          capture={"environment"}
                          hidden={true}
                          multiple={true}
                        />
                        <span style={cssStyle("font-size:1.4rem")}>{"📷"}</span>
                        {row25.v27}
                      </UploadTile>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
                {"\n    "}
              </PhotoUploader>
              {"\n    "}
              <div className={"row mt"}>
                <WizardButton
                  className={"btn btn-line"}
                  data-prev={true}
                  type={"button"}
                >
                  {"Back"}
                </WizardButton>
                <WizardButton
                  className={"btn btn-primary grow btn-lg"}
                  data-next={true}
                  type={"button"}
                >
                  {"Next"}
                </WizardButton>
              </div>
              {"\n  "}
            </div>
          </div>
        </WizardStep>
        {"\n\n  "}
        <WizardStep className={"step"}>
          <div className={"card"}>
            <div className={"card-b stack"}>
              {"\n    "}
              <h3>{"Customer sign-off"}</h3>
              {"\n    "}
              <p className={"muted small"} style={cssStyle("margin:0")}>
                {
                  "Hand the phone to the customer. They confirm what was installed and sign with a finger."
                }
              </p>
              {"\n    "}
              <FieldGroup className={"field"}>
                <label>{"Customer name"}</label>
                <Field
                  className={"inp"}
                  name={"signed_by"}
                  value={text(data.v28)}
                  required={true}
                />
              </FieldGroup>
              {"\n    "}
              <SignaturePad className={"sigpad"} data-sigpad={true}>
                <canvas></canvas>
                <Field type={"hidden"} name={"signature"} value={""} />
                <div className={"spread mt-s"}>
                  <span className={"hint"}>{"Sign inside the box"}</span>
                  <button
                    className={"btn btn-line btn-sm"}
                    type={"button"}
                    data-sig-clear={true}
                  >
                    {"Clear"}
                  </button>
                </div>
              </SignaturePad>
              {"\n    "}
              <FieldGroup className={"field"}>
                <label>{"Notes"}</label>
                <TextArea className={"inp"} name={"notes"}>
                  {data.v29}
                </TextArea>
              </FieldGroup>
              {"\n    "}
              <div>
                <GeoButton
                  className={"btn btn-line btn-sm"}
                  type={"button"}
                  data-geo={true}
                >
                  {"📍 Capture location (optional)"}
                </GeoButton>{" "}
                <GeoStatus
                  className={"small muted"}
                  data-geo-out={true}
                ></GeoStatus>
                <Field type={"hidden"} name={"geo_lat"} />
                <Field type={"hidden"} name={"geo_lng"} />
              </div>
              {"\n    "}
              <div className={"row"}>
                <WizardButton
                  className={"btn btn-line"}
                  data-prev={true}
                  type={"button"}
                >
                  {"Back"}
                </WizardButton>
                <button className={"btn btn-primary grow btn-lg"}>
                  {"Submit and hand over"}
                </button>
              </div>
              {"\n  "}
            </div>
          </div>
        </WizardStep>
        {"\n"}
      </ActionForm>
      {"\n"}
    </>
  );
}
