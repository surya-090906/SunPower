// Native React page. Data contract: backoffice/tabs/qualification.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  SelectField,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"First call: verify the basics"}</h2>
            {data.choice1 === 0 ? (
              <>
                <span className={"badge b-green"}>
                  {"Done "}
                  {data.v2}
                </span>
              </>
            ) : null}
          </div>
          <div className={"card-b"}>
            {"\n  "}
            {data.choice3 === 0 ? (
              <>
                <div className={"banner bad mb"}>
                  <span className={"ico"}>{"!"}</span>
                  <div>
                    <div className={"big"}>{"Not feasible as requested"}</div>
                    <ul
                      className={"small"}
                      style={cssStyle("margin:.3rem 0 0 1rem;padding:0")}
                    >
                      {data.rows4?.length ? (
                        data.rows4.map((row4, index) => (
                          <Fragment key={index}>
                            <li>{row4.v5}</li>
                          </Fragment>
                        ))
                      ) : (
                        <></>
                      )}
                    </ul>
                    {data.choice6 === 0 ? (
                      <>
                        <div className={"small mt-s"}>
                          <b>
                            {"A "}
                            {data.v7}
                            {" kW system would fit."}
                          </b>
                          {
                            " Change the capacity below and qualify again, or mark the enquiry lost with a reason."
                          }
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
            {data.choice8 === 0 ? (
              <>
                {"\n  "}
                <ActionForm
                  method={"post"}
                  action={"/app/p/" + text(data.v9) + "/do/qualify/"}
                  className={"stack"}
                >
                  <CsrfField />
                  {"\n    "}
                  <div className={"fields"}>
                    {"\n      "}
                    {data.choice10 === 0 ? (
                      <>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>{"Shadow-free roof area (sq ft)"}</label>
                          <Field
                            className={"inp"}
                            name={"area"}
                            value={text(data.v11)}
                            inputMode={"numeric"}
                            required={true}
                          />
                          <span className={"hint"}>
                            {"A "}
                            {data.v12}
                            {" kW system needs about "}
                            {data.v13}
                            {" sq ft."}
                          </span>
                        </FieldGroup>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>{"Monthly electricity bill (₹)"}</label>
                          <Field
                            className={"inp"}
                            name={"bill"}
                            value={
                              data.choice14 === 0
                                ? text(data.v15)
                                : data.choice14 === 1
                                  ? text(data.v16)
                                  : ""
                            }
                            inputMode={"numeric"}
                            required={true}
                          />
                        </FieldGroup>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>{"Grid phase"}</label>
                          <SelectField className={"inp"} name={"phase"}>
                            <option
                              value={"single"}
                              {...(data.attr17 === 0 ? { selected: true } : {})}
                            >
                              {"Single phase"}
                            </option>
                            <option
                              value={"three"}
                              {...(data.attr18 === 0 ? { selected: true } : {})}
                            >
                              {"Three phase"}
                            </option>
                          </SelectField>
                        </FieldGroup>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>
                            {"Sanctioned load (kW)"}
                            {data.choice19 === 0 ? (
                              <>
                                {" "}
                                <span className={"faint"}>
                                  {"(not needed off-grid)"}
                                </span>
                              </>
                            ) : null}
                          </label>
                          <Field
                            className={"inp"}
                            name={"load"}
                            value={text(data.v20)}
                            inputMode={"decimal"}
                            {...(data.attr21 === 0 ? { required: true } : {})}
                          />
                        </FieldGroup>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>{"Electricity board (DISCOM)"}</label>
                          <Field
                            className={"inp"}
                            name={"discom"}
                            value={text(data.v22)}
                            placeholder={"BESCOM"}
                          />
                        </FieldGroup>
                        {"\n      "}
                        <FieldGroup className={"field"}>
                          <label>{"Capacity (kW)"}</label>
                          <SelectField className={"inp"} name={"kw"}>
                            {data.rows23?.length ? (
                              data.rows23.map((row23, index) => (
                                <Fragment key={index}>
                                  <option
                                    value={text(row23.v24)}
                                    {...(row23.attr25 === 0
                                      ? { selected: true }
                                      : {})}
                                  >
                                    {row23.v26}
                                    {" kW"}
                                  </option>
                                </Fragment>
                              ))
                            ) : (
                              <></>
                            )}
                          </SelectField>
                          {data.choice27 === 0 ? (
                            <>
                              <span className={"hint"}>
                                {"The bill suggests about "}
                                {data.v28}
                                {" kW."}
                              </span>
                            </>
                          ) : null}
                        </FieldGroup>
                        {"\n      "}
                      </>
                    ) : null}
                    {"\n      "}
                    <FieldGroup className={"field full"}>
                      <label>{"Call notes"}</label>
                      <TextArea className={"inp"} name={"notes"} rows={"2"}>
                        {data.v29}
                      </TextArea>
                    </FieldGroup>
                    {"\n    "}
                  </div>
                  {"\n    "}
                  <div>
                    <button className={"btn btn-primary"}>
                      {"Save and check feasibility"}
                    </button>
                  </div>
                  {"\n  "}
                </ActionForm>
                {"\n  "}
              </>
            ) : data.choice8 === 1 ? (
              <>
                {"\n  "}
                <dl className={"kv"}>
                  <dt>{"Verified roof area"}</dt>
                  <dd>
                    {data.v30}
                    {" sq ft"}
                  </dd>
                  <dt>{"Monthly bill"}</dt>
                  <dd>{data.v31}</dd>
                  <dt>{"Grid"}</dt>
                  <dd>
                    {data.v32}
                    {" phase · "}
                    {data.v33}
                    {" kW · "}
                    {data.v34}
                  </dd>
                  <dt>{"Verified by"}</dt>
                  <dd>
                    {data.v35}
                    {" on "}
                    {data.v36}
                  </dd>
                  <dt>{"Notes"}</dt>
                  <dd>{data.v37}</dd>
                </dl>
                {"\n  "}
              </>
            ) : null}
            {"\n  "}
          </div>
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"What the customer told us"}</h2>
          </div>
          <div className={"card-b"}>
            {"\n    "}
            <dl
              className={"kv"}
              style={cssStyle("grid-template-columns:120px 1fr")}
            >
              {"\n      "}
              <dt>{"Roof area"}</dt>
              <dd>
                {data.v38}
                {data.choice39 === 0 ? <>{" sq ft"}</> : null}
              </dd>
              {"\n      "}
              <dt>{"Monthly bill"}</dt>
              <dd>
                {data.choice40 === 0 ? (
                  <>
                    {"₹"}
                    {data.v41}
                  </>
                ) : data.choice40 === 1 ? (
                  <>{"–"}</>
                ) : null}
              </dd>
              {"\n      "}
              <dt>{"Roof type"}</dt>
              <dd>{data.v42}</dd>
              {"\n      "}
              <dt>{"Load / DISCOM"}</dt>
              <dd>
                {data.v43}
                {" / "}
                {data.v44}
              </dd>
              {"\n    "}
            </dl>
            <p className={"hint mt-s"}>
              {
                "These are the customer's own figures. Confirm or correct them on the call; both versions are kept."
              }
            </p>
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
