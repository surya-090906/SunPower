// Native React page. Data contract: backoffice/tabs/survey.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {data.choice1 === 0 ? (
        <>
          <div className={"banner info"}>
            <span className={"ico"}>{"i"}</span>
            <div>{"Hardware-only sale: no roof survey is needed."}</div>
          </div>
        </>
      ) : data.choice1 === 1 ? (
        <>
          {"\n"}
          {data.choice2 === 0 ? (
            <>
              <div className={"gate"}>
                {
                  "The survey is requested automatically once the first call qualifies the enquiry."
                }
              </div>
            </>
          ) : null}
          {"\n"}
          <div className={"stack"}>
            {"\n"}
            {data.rows3?.length ? (
              data.rows3.map((row3, index) => (
                <Fragment key={index}>
                  {"\n"}
                  <div className={"card"}>
                    <div className={"card-h"}>
                      <div className={"row"}>
                        <h2>
                          {"Survey #"}
                          {row3.v4}
                        </h2>
                        <span className={"badge " + text(row3.v5)}>
                          {row3.v6}
                        </span>
                      </div>
                      {"\n  "}
                      <span className={"small muted"}>
                        {row3.choice7 === 0 ? (
                          <>
                            {row3.v8}
                            {" · "}
                          </>
                        ) : null}
                        {row3.v9}
                      </span>
                    </div>
                    {"\n"}
                    <div className={"card-b"}>
                      {"\n  "}
                      <div className={"row mb-s"}>
                        {row3.choice10 === 0 ? (
                          <>
                            <span className={"badge b-green"}>
                              {"Customer confirmed the date"}
                            </span>
                          </>
                        ) : row3.choice10 === 1 ? (
                          <>
                            <span className={"badge b-grey"}>
                              {"Customer has not confirmed"}
                            </span>
                          </>
                        ) : null}
                        {row3.choice11 === 0 ? (
                          <>
                            <span className={"badge b-amber"}>
                              {"Reschedule asked: "}
                              {row3.v12}
                            </span>
                          </>
                        ) : null}
                      </div>
                      {"\n  "}
                      {row3.choice13 === 0 ? (
                        <>
                          {"\n  "}
                          <dl className={"kv"}>
                            <dt>{"Roof"}</dt>
                            <dd>
                              {row3.v14}
                              {"-facing "}
                              {row3.v15}
                              {", "}
                              {row3.v16}
                              {"° tilt, "}
                              {row3.v17}
                              {" sq ft usable"}
                            </dd>
                            <dt>{"Cable run"}</dt>
                            <dd>
                              {row3.v18}
                              {" m (array to inverter)"}
                            </dd>
                            <dt>{"Shading"}</dt>
                            <dd>{row3.v19}</dd>
                            {row3.choice20 === 0 ? (
                              <>
                                <dt>{"Notes"}</dt>
                                <dd>{row3.v21}</dd>
                              </>
                            ) : null}
                            {row3.choice22 === 0 ? (
                              <>
                                <dt>{"Reviewed"}</dt>
                                <dd>
                                  {row3.v23}
                                  {" · "}
                                  {row3.v24}
                                  {row3.choice25 === 0 ? (
                                    <>
                                      {" · "}
                                      {row3.v26}
                                    </>
                                  ) : null}
                                </dd>
                              </>
                            ) : null}
                          </dl>
                          {"\n  "}
                          <div className={"thumbs mt-s"}>
                            {row3.rows27?.length ? (
                              row3.rows27.map((row27, index) => (
                                <Fragment key={index}>
                                  <a
                                    className={"thumb"}
                                    href={text(row27.v28)}
                                    target={"_blank"}
                                  >
                                    <img
                                      src={text(row27.v29)}
                                      alt={"survey photo"}
                                    />
                                    <span className={"k"}>{row27.v30}</span>
                                  </a>
                                </Fragment>
                              ))
                            ) : (
                              <></>
                            )}
                          </div>
                          {"\n  "}
                        </>
                      ) : row3.choice13 === 1 ? (
                        <>
                          <p
                            className={"muted small"}
                            style={cssStyle("margin:0")}
                          >
                            {
                              "Waiting for the technician to visit and submit the survey on their phone."
                            }
                          </p>
                        </>
                      ) : null}
                      {"\n  "}
                      {row3.choice31 === 0 ? (
                        <>
                          <hr />
                          {"\n    "}
                          {row3.choice32 === 0 ? (
                            <>
                              <ActionForm
                                method={"post"}
                                action={
                                  "/app/p/" +
                                  text(row3.v33) +
                                  "/do/survey_review/"
                                }
                                className={"stack"}
                              >
                                <CsrfField />
                                <Field
                                  type={"hidden"}
                                  name={"survey"}
                                  value={text(row3.v34)}
                                />
                                {"\n      "}
                                <FieldGroup className={"field"}>
                                  <label>
                                    {"Review note "}
                                    <span className={"faint"}>
                                      {"(required to reject)"}
                                    </span>
                                  </label>
                                  <Field
                                    className={"inp"}
                                    name={"note"}
                                    placeholder={
                                      "For example: photos unclear, re-measure the cable run"
                                    }
                                  />
                                </FieldGroup>
                                {"\n      "}
                                <div className={"row"}>
                                  <button
                                    className={"btn btn-ok"}
                                    name={"decision"}
                                    value={"approve"}
                                  >
                                    {"Approve survey"}
                                  </button>
                                  <button
                                    className={"btn btn-danger"}
                                    name={"decision"}
                                    value={"reject"}
                                  >
                                    {"Reject and re-survey"}
                                  </button>
                                </div>
                              </ActionForm>
                              {"\n    "}
                            </>
                          ) : row3.choice32 === 1 ? (
                            <>
                              <div className={"gate"}>
                                {
                                  "Waiting for an Engineer to approve this survey. The quote stays locked until then."
                                }
                              </div>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      {"\n"}
                    </div>
                  </div>
                  {"\n"}
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </>
      ) : null}
      {"\n"}
    </>
  );
}
